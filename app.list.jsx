import { useSubmit } from "@remix-run/react";
import {
  Box,
  Card,
  Layout,
  FormLayout,
  TextField,
  Page,
  VerticalStack,
  PageActions,
} from "@shopify/polaris";
import { useState } from "react";
import { authenticate } from "~/shopify.server";
import db from "../db.server";
import { redirect } from "@remix-run/node";

export async function action({ request, params }) {
  const { session } = await authenticate.admin(request);
  const { shop } = session;
  /** @type {any} */
  const data = {
    ...Object.fromEntries(await request.formData()),
    shop,
  };

  // if (data.action === "delete") {
  //   await db.ticket.delete({ where: { id: Number(params.id) } });
  //   return redirect("/app");
  // }

  // const errors = validateData(data);

  // if (errors) {
  //   return json({ errors }, { status: 422 });
  // }
  
  // const ticket =
  //   params.id === "new"
  //     ? await db.ticket.create({ data })
  //     : await db.ticket.update({ where: { id: Number(params.id) }, data });
  await db.ticket.create({ data });
  
  return redirect("/app/list");
}

export default function ListPage() {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");

  const submit = useSubmit();

  function handleSave() {
    const data = {
      title:  title || "",
      content: content || "",
    };
    console.log('data', data);
    submit(data, { method: "post" });
  }

  return (
    <Page>
      <ui-title-bar title="List" />
      <Layout>
        <Layout.Section>
          <Card>
            <VerticalStack gap="3">
              <FormLayout>
                <TextField label="Ticket Title" onChange={setTitle} value={title} autoComplete="off" />
                <TextField
                  label="Content"
                  value={content}
                  onChange={setContent}
                  multiline={4}
                  autoComplete="off"
                />
              </FormLayout>
            </VerticalStack>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <PageActions
            primaryAction={{
              content: "Submit",
              onAction: handleSave
            }}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}