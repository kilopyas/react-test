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
} from "@shopify/polaris";
import { useState } from "react";
import db from "../db.server";
import { json, redirect } from "@remix-run/node";
import { deleteTicketsInBulk, getTickets, validateData } from "~/models/Ticket.server";
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
        // return redirect("/app/list/?aaaaa=true");
        return data;
      } else if (action === "update") {
        let id = data.id;
        delete data.id
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

  const nav = useNavigation();
  const isSaving =
    nav.state === "submitting" && nav.formData?.get("action") !== "delete";
  const isDeleting =
    nav.state === "submitting" && nav.formData?.get("action") === "delete";

  const updateGrandparentState = (data) => {
    setTitle(data.title);
    setContent(data.content);
    setIsEdit(data.id);
  };

  const handleSave = () => {
    const data = {
      title:  title || "",
      content: content || "",
      action: isEdit ? "update" : 'new'
    };

    if(data.title && data.content) {
      setTitle("");
      setContent("");
    }

    if(isEdit) {
      data.id = parseInt(isEdit.toString());
      setIsEdit(0);
    }

    submit(data, { method: "post" });
  };

  const goBack = () => {
    setIsEdit(0);
    submit({action: 'back'}, { method: "post" });
  };

  const bulkDelete = () => {
    submit({action: 'bulk-delete', ids: selectedResources}, { method: "post" });
  };

  const bulkActions = [
    {
      content: 'Bulk Delete',
      onAction: bulkDelete,
    },
  ];

  return (
    <Page>
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
              </FormLayout>
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
              loading: isSaving,
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
                <TicketTableWithPagination tickets={tickets} itemsPerPage={itemsPerPage} bulkActions={bulkActions} allResourcesSelected={allResourcesSelected} selectedResources={selectedResources} handleSelectionChange={handleSelectionChange} updateGrandparentState={updateGrandparentState} />
              )}
              </VerticalStack>
            </Card>
          </Layout.Section>
        }

      </Layout>
    </Page>
  );
}

function TicketTableWithPagination({ tickets, itemsPerPage, bulkActions, allResourcesSelected, selectedResources, handleSelectionChange, updateGrandparentState }) {
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
            updateGrandparentState={updateGrandparentState} />
        ))}
      </IndexTable>
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

const TicketTableRow = ({ ticket, selectedResources, updateGrandparentState }) => (
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
          <EditButton ticket={ticket} updateGrandparentState={updateGrandparentState} />
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

function EditButton({ticket, updateGrandparentState}) {
  const submit = useSubmit();


  const handleUpdateParentState = () => {
    const data = {
      id: ticket.id,
      title: ticket.title,
      content: ticket.content,
      action: 'edit'
    };

    updateGrandparentState(data);
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

function DeleteButton(ticket) {
  const submit = useSubmit();
  const nav = useNavigation();
  const isDeleting =
    nav.state === "submitting" && nav.formData?.get("action") === "delete";

  const data = {
    id: ticket.ticket.id,
    action: 'delete'
  };
  
  return <Button onClick={(e) => {
    submit(data, { method: "post" });
  }} destructive loading={isDeleting}>Delete</Button>;
}