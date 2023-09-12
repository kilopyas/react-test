import { Link, useActionData, useLoaderData, useSubmit } from "@remix-run/react";
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
    case "bulkDelete":
      console.log('length', data.ids.length);
      deleteTicketsInBulk(data.ids);
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
      } else if (action === "edit") {
        return data;
      } else if (action === "update") {
        let id = data.id;
        delete data.id
        await db.ticket.update({ where: { id: Number(id) }, data });
      }
    default:
      return redirect("/app/list");
  } 

}

export default function ListPage() {
  const submit = useSubmit();
  const { tickets } = useLoaderData();
  const actionData = useActionData();
  const errors = useActionData()?.errors || {};
  const {selectedResources, allResourcesSelected, handleSelectionChange} = useIndexResourceState(tickets);
  
  let [title, setTitle] = useState("");
  let [content, setContent] = useState("");
  let [isEdit, setIsEdit] = useState(0);

  if(actionData && !actionData.errors) {
    title = actionData.title;
    content = actionData.content;
    isEdit = actionData.id;
  }

  function handleSave() {
    const data = {
      title:  title || "",
      content: content || "",
      action: isEdit ? "update" : 'new'
    };

    if(isEdit) {
      data.id = parseInt(isEdit);
      setIsEdit(0);
    }

    console.log('data', data);
    submit(data, { method: "post" });
  }

  function goBack() {
    setIsEdit(0);
    submit({action: 'back'}, { method: "post" });
  }

  function bulkDelete() {
    submit({action: 'bulkDelete', ids: selectedResources}, { method: "post" });
  }

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
                  <TicketTable 
                  tickets={tickets} 
                  selectedResources={selectedResources}
                  allResourcesSelected={allResourcesSelected}
                  handleSelectionChange={handleSelectionChange}
                  bulkActions={bulkActions} />
                )}
              </VerticalStack>
            </Card>
          </Layout.Section>
        }
      </Layout>
    </Page>
  );
}

const TicketTable = ({ tickets, selectedResources, allResourcesSelected, handleSelectionChange, bulkActions }) => (
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
      {tickets.map((ticket) => (
        <TicketTableRow 
          key={ticket.id} 
          ticket={ticket} 
          selectedResources={selectedResources} />
      ))}
    </IndexTable>
  </LegacyCard>
);

const TicketTableRow = ({ ticket, selectedResources }) => (
  <IndexTable.Row id={ticket.id} key={ticket.id} selected={selectedResources.includes(ticket.id)} position={ticket.id}>
    <IndexTable.Cell>
      {ticket.id}
    </IndexTable.Cell>
    <IndexTable.Cell>
      <Link to={`tickets/${ticket.id}`}>{truncate(ticket.title)}</Link>
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
          <EditButton ticket={ticket} />
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

function EditButton(ticket) {
  const submit = useSubmit();
  const data = {
    id: ticket.ticket.id,
    title: ticket.ticket.title,
    content: ticket.ticket.content,
    action: 'edit'
  };

  return (
    <span style={{color: '#bf0711', marginRight: '10px'}}>
      <Button onClick={(e) => {
          submit(data, { method: "post" });
        }} monochrome outline>
        Edit
      </Button>
    </span>
  );
}

function DeleteButton(ticket) {
  const submit = useSubmit();
  const data = {
    id: ticket.ticket.id,
    action: 'delete'
  };
  
  return <Button onClick={(e) => {
    submit(data, { method: "post" });
  }} destructive>Delete</Button>;
}