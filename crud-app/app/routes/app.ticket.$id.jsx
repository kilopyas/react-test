import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Box,
  Card,
  Layout,
  Link,
  List,
  Page,
  Text,
  VerticalStack,
} from "@shopify/polaris";
import { getTicket } from "~/models/Ticket.server";
import { authenticate } from "~/shopify.server";

export async function loader({ request, params }) {
  console.log('paramsparamsparamsparamsparamsparams', params);
  console.log('requestrequestrequestrequestrequestrequest', request);
  const { session } = await authenticate.admin(request);
  const ticket = await getTicket(params.id);

  return json({
    ticket,
  });
}

export default function ViewPage() {
  const { ticket } = useLoaderData();
  console.log('test', ticket);
  return (
    <Page>
      <ui-title-bar title={ticket.title} />
      <Layout>
        <Layout.Section>
          <Card>
            <VerticalStack gap="3">
              <Text as="p" variant="bodyMd">
                {ticket.content}
              </Text>
            </VerticalStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}