import { Link, useActionData, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import {
  Card,
  Layout,
  FormLayout,
  TextField,
  Page,
  VerticalStack,
  PageActions,
  EmptyState,
  IndexTable,
  Button,
  useIndexResourceState,
  LegacyCard,
  Pagination,
  Modal,
  TextContainer,
  LegacyStack,
  Collapsible,
  Thumbnail,
  HorizontalStack,
  Frame,
  Loading,
  Tag,
} from "@shopify/polaris";
import { useCallback, useEffect, useState } from "react";
import db from "../db.server";
import { json, redirect } from "@remix-run/node";
import { deleteTicketsInBulk, getTickets, validateData } from "~/models/Ticket.server";
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
    case "back":
      return redirect("/app/list");
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

function TicketTableWithPagination({ 
  tickets, itemsPerPage, bulkActions, allResourcesSelected, selectedResources, 
  handleSelectionChange, updateFormState, isBulkModalOpen,
  closeBulkModal, bulkDelete
}) {

  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(tickets.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedData = tickets.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <LegacyCard>
      <IndexTable
        resourceName={{
          singular: "Ticket",
          plural: "Tickets",
        }}
        itemCount={tickets.length}
        selectedItemsCount={
          allResourcesSelected ? 'All' : selectedResources.length
        }
        onSelectionChange={handleSelectionChange}
        headings={[
          { title: "ID" },
          { title: "Title" },
          { title: "Content" },
          { title: "Date created" },
          { title: "Actions" }
        ]}
        bulkActions={bulkActions}
      >
        {displayedData.map((ticket) => (
          <TicketTableRow 
            key={ticket.id} 
            ticket={ticket} 
            selectedResources={selectedResources}
            updateFormState={updateFormState} />
        ))}
      </IndexTable>
      <BulkModal isBulkModalOpen={isBulkModalOpen} closeBulkModal={closeBulkModal} bulkDelete={bulkDelete} />
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <Pagination
          hasPrevious={currentPage > 1}
          onPrevious={() => handlePageChange(currentPage - 1)}
          hasNext={currentPage < totalPages}
          onNext={() => handlePageChange(currentPage + 1)}
        />
      </div>
    </LegacyCard>
  );
}

function BulkModal({isBulkModalOpen, closeBulkModal, bulkDelete}) {
  return (
    <Modal
      open={isBulkModalOpen}
      onClose={closeBulkModal}
      title="Confirm Delete"
      primaryAction={{
        content: 'Delete selected',
        onAction: bulkDelete,
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: closeBulkModal,
        },
      ]}
    >
      <Modal.Section>
        <p>Are you sure you want to delete the selected items?</p>
      </Modal.Section>
    </Modal>
  )
}

const TicketTableRow = ({ ticket, selectedResources, updateFormState }) => (
  <IndexTable.Row id={ticket.id} key={ticket.id} selected={selectedResources.includes(ticket.id)} position={ticket.id}>
    <IndexTable.Cell>
      {ticket.id}
    </IndexTable.Cell>
    <IndexTable.Cell>
      <Link to={`/app/ticket/${ticket.id}`}>{truncate(ticket.title)}</Link>
    </IndexTable.Cell>
    <IndexTable.Cell>
      {truncate(ticket.content)}
    </IndexTable.Cell>
    <IndexTable.Cell>
      {new Date(ticket.createdAt).toDateString()}
    </IndexTable.Cell>
    <IndexTable.Cell>
      {
        <div>
          <EditButton ticket={ticket} updateFormState={updateFormState} />
          <DeleteButton ticket={ticket} />
        </div>
      }
    </IndexTable.Cell>
  </IndexTable.Row>
);

const EmptyTicketState = () => (
  <EmptyState
    heading="Create a ticket"
    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
  >
    <p>Tickets will be displayed here.</p>
  </EmptyState>
);

function truncate(str, { length = 25 } = {}) {
  if (!str) return "";
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}

function EditButton({ticket, updateFormState}) {
  const submit = useSubmit();

  const handleUpdateParentState = () => {
    const data = {
      id: ticket.id,
      title: ticket.title,
      content: ticket.content,
      image_urls: ticket.image_url,
      action: 'edit'
    };

    updateFormState(data);
    submit(data, { method: "post" });
  };
  
  return (
    <span style={{color: '#bf0711', marginRight: '10px'}}>
      <Button onClick={handleUpdateParentState} monochrome outline>
        Edit
      </Button>
    </span>
  );
}

function DeleteButton({ ticket }) {
  const [modalOpen, setModalOpen] = useState(false);
  const submit = useSubmit();
  const nav = useNavigation();
  const isDeleting =
    nav.state === "submitting" && nav.formData?.get("action") === "delete";

  const handleDelete = async () => {
    const data = {
      id: ticket.id,
      action: 'delete'
    };

    submit(data, { method: "post" });
    setModalOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setModalOpen(true)}
        destructive
        loading={isDeleting}
      >
        Delete
      </Button>
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Confirm Delete"
        primaryAction={{
          content: 'Delete',
          onAction: handleDelete,
          loading: isDeleting,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <TextContainer>
            <p>
              Are you sure you want to delete this ticket?
              This action cannot be undone.
            </p>
          </TextContainer>
        </Modal.Section>
      </Modal>
    </>
  );
}

function CollapsibleExample({ ticketImageUrls, setTicketImageUrls, isEdit }) {
  const [open, setOpen] = useState(false);
  const COL_OPEN_TEXT = "Show images";
  const COL_CLOSE_TEXT = "Hide images";
  const [toggleText, setToggleText] = useState(COL_OPEN_TEXT);

  const handleToggle = useCallback(() => {
    setOpen((open) => !open)
    setToggleText((text) => text == COL_OPEN_TEXT ? COL_CLOSE_TEXT : COL_OPEN_TEXT)
  }, []);

  return (
    <div style={{height: '200px'}}>
      <LegacyCard sectioned>
        <LegacyStack vertical>
          <Button
            plain
            onClick={handleToggle}
            ariaExpanded={open}
            ariaControls="basic-collapsible"
          >
            { toggleText }
          </Button>
          <Collapsible
            open={open}
            id="basic-collapsible"
            transition={{duration: '500ms', timingFunction: 'ease-in-out'}}
            expandOnPrint
          >

          { ticketImageUrls.length > 0 ? 
              <Layout.Section>
                <HorizontalStack gap="3">
                  <RemovableImage ticketImageUrls={ticketImageUrls} setTicketImageUrls={setTicketImageUrls}/>
                </HorizontalStack>
              </Layout.Section> : null
          }
            
          </Collapsible>
        </LegacyStack>
      </LegacyCard>
    </div>
  );
}

function RemovableImage({ ticketImageUrls, setTicketImageUrls }) {
  const [selectedTags, setSelectedTags] = useState(ticketImageUrls);

  const removeTag = useCallback(
    (tag) => () => {
      setSelectedTags((previousTags) =>
        previousTags.filter((previousTag) => previousTag !== tag),
      );
      console.log('removeTag', selectedTags);
    },
    [],
  );

  
  console.log('removeTag2', selectedTags);
  const tagMarkup = selectedTags.map((option) => (
    <Tag key={option} onRemove={removeTag(option)}>
      <Thumbnail key={option} size="large" source={option} alt={option}/>
    </Tag>
  ));
  
  useEffect(() => {
    if (ticketImageUrls !== selectedTags) {
      setTicketImageUrls(selectedTags);
    }
  }, [ticketImageUrls, selectedTags]);

  return <LegacyStack spacing="tight">{tagMarkup}</LegacyStack>;
}