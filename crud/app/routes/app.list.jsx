import { useActionData, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import {
  Card,
  Layout,
  FormLayout,
  TextField,
  Page,
  VerticalStack,
  PageActions,
  useIndexResourceState,
  Frame,
  Loading,
} from "@shopify/polaris";
import { useState } from "react";
import db from "../db.server";
import { json, redirect } from "@remix-run/node";
import { deleteTicketsInBulk, getTickets, validateData } from "~/models/Ticket.server";
import { CollapsibleExample, EmptyTicketState, TicketTableWithPagination } from "~/lib/ticket.library.components";
import { DropZoneWithImageFileUpload } from "~/custom-components/FileUpload";
import { authenticate } from "~/shopify.server";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  const tickets = await getTickets();

  return json({
    tickets,
  });
}

export async function action({ request }) {
  /** @type {any} */
  const data = {
    ...Object.fromEntries(await request.formData())
  };
  const action = data.action;
  delete data.action;

  switch(action) {
    case "delete":
      await db.ticket.delete({ where: { id: Number(data.id) } });
      return redirect("/app/list");
    case "bulk-delete":
      deleteTicketsInBulk(data.ids.split(","));
      return redirect("/app/list");
    case "new":
    case "edit":
    case "update":
      const errors = validateData(data);
      if (errors) {
        return json({ errors }, { status: 422 });
      }
      if(action === "new") {
        data.statusState = "pending";
        await db.ticket.create({ data })
        return data;
      } else if (action === "edit") {
        data.orig_imageUrls = data.image_urls;
        return data;
      } else if (action === "update") {
        let id = data.id;
        delete data.id
        data.image_url = (data.image_url === "null") ? null : data.image_url;
        await db.ticket.update({ where: { id: Number(id) }, data });
        return data;
      }
    default:
      return redirect("/app/list");
  } 

}

export default function ListPage() {
  const { tickets } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const errors = useActionData()?.errors || {};
  const {selectedResources, allResourcesSelected, handleSelectionChange} = useIndexResourceState(tickets);
  const itemsPerPage = 10;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isEdit, setIsEdit] = useState(0);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [files, setFiles] = useState([]);
  const [rejectedFiles, setRejectedFiles] = useState([]);
  const [ticketImageUrls, setTicketImageUrls] = useState([]);

  const nav = useNavigation();
  const isSaving =
    nav.state === "submitting" && nav.formData?.get("action") !== "delete";
  const isDeleting =
    nav.state === "submitting" && nav.formData?.get("action") === "delete";

  const handleSave = async () => {
    setIsSending(true);
    const data = {
      title:  title || "",
      content: content || "",
      action: isEdit ? "update" : 'new'
    };

    let isImgHasChangesAfterEdit = false;
    if(isEdit) {
      let origImgUrls = JSON.parse(actionData.orig_imageUrls);
      data.id = parseInt(isEdit.toString());
      isImgHasChangesAfterEdit = JSON.stringify(origImgUrls) !== JSON.stringify(ticketImageUrls);
    }

    if( (data.title && data.content && files.length > 0) || isImgHasChangesAfterEdit) {
      console.log('nisulod', files);
      const formData = new FormData();

      let imageUrls = isEdit ? (ticketImageUrls && ticketImageUrls.length) ? ticketImageUrls : [] : [];
      for(const file of files) {
        formData.append('file', file);
        formData.append('upload_preset',"x0w2sksd");

        const cloudinaryData = await fetch('https://api.cloudinary.com/v1_1/dk66wt1jb/image/upload', {
          method: 'POST',
          body: formData
        }).then(response => response.json());
        console.log('cloudinaryData', cloudinaryData);
        imageUrls.push(cloudinaryData.secure_url);
      }
      console.log('imageUrls', imageUrls);
      console.log('imageUrlslength', imageUrls.length);
      console.log('imageUrlslength', imageUrls.length === 0);

      data.image_url = imageUrls.length === 0 ? null : JSON.stringify(imageUrls);
    }

    submit(data, { method: "post" });
    setIsSending(false);
    setIsEdit(0);
    clearFields(data);
  };

  const updateFormState = (data) => {
    setTitle(data.title);
    setContent(data.content);
    setIsEdit(data.id);
    setTicketImageUrls(JSON.parse(data.image_urls));
  };

  const clearFields = (data) => {
    if(data.title && data.content) {
      setTitle("");
      setContent("");
      setFiles([]);
      setRejectedFiles([]);
    }
  }

  const goBack = () => {
    updateFormState({title: "", content: "", id: "", image_urls: '[]'})
    submit({action: 'back'}, { method: "post" });
  };

  const bulkDelete = () => {
    setIsBulkModalOpen(false);
    submit({action: 'bulk-delete', ids: selectedResources}, { method: "post" });
  };

  const openBulkModal = () => {
    setIsBulkModalOpen(true);
  };

  const closeBulkModal = () => {
    setIsBulkModalOpen(false);
  };

  const bulkActions = [
    {
      content: 'Bulk Delete',
      onAction: openBulkModal,
    },
  ];

  return (
    <Page>
      <Frame>
        { isSaving || isSending || isDeleting  ? <Loading /> : null }
        <ui-title-bar title="Ticketing CRUD" />
        <Layout>
          <Layout.Section>
            <Card>
              <VerticalStack gap="3">
                <FormLayout>
                  <TextField label="Ticket Title" onChange={setTitle} value={title} autoComplete="off" error={errors.title} />
                  <TextField
                    label="Content"
                    value={content}
                    onChange={setContent}
                    multiline={4}
                    autoComplete="off"
                    error={errors.content}
                  />
                  <DropZoneWithImageFileUpload 
                    files={files} 
                    setFiles={setFiles} 
                    rejectedFiles={rejectedFiles} 
                    setRejectedFiles={setRejectedFiles} 
                  />
                </FormLayout>
                { isEdit && ticketImageUrls && ticketImageUrls.length ? <CollapsibleExample ticketImageUrls={ticketImageUrls} setTicketImageUrls={setTicketImageUrls} isEdit={isEdit} /> : null }
              </VerticalStack>
            </Card>
          </Layout.Section>
          <Layout.Section>
            <PageActions
              secondaryActions={isEdit ? [
                {
                  content: "Back",
                  onAction: goBack,
                },
              ] : false}
              primaryAction={{
                content: isEdit ? "Update" : "Submit",
                loading: isSaving || isSending,
                onAction: handleSave
              }}
            />
          </Layout.Section>
          {
            isEdit ? null :
            <Layout.Section>
              <Card>
                <VerticalStack gap="3">
                {tickets.length === 0 ? (
                    <EmptyTicketState />
                  ) : (
                  <TicketTableWithPagination 
                    tickets={tickets} 
                    itemsPerPage={itemsPerPage} 
                    bulkActions={bulkActions} 
                    allResourcesSelected={allResourcesSelected} 
                    selectedResources={selectedResources} 
                    handleSelectionChange={handleSelectionChange} 
                    updateFormState={updateFormState} 
                    isBulkModalOpen={isBulkModalOpen}
                    closeBulkModal={closeBulkModal}
                    bulkDelete={bulkDelete}
                    />
                )}
                </VerticalStack>
              </Card>
            </Layout.Section>
          }

        </Layout>
      </Frame>
    </Page>
  );
}