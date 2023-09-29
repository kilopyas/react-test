import { Link, useNavigation, useSubmit } from "@remix-run/react";
import {
  Layout,
  EmptyState,
  IndexTable,
  Button,
  LegacyCard,
  Pagination,
  Modal,
  TextContainer,
  LegacyStack,
  Collapsible,
  Thumbnail,
  HorizontalStack,
  Tag,
  Badge,
} from "@shopify/polaris";
import { useCallback, useEffect, useState } from "react";
import { getBannerStatusByTicketStatusId } from "~/models/Ticket.server";

export function TicketTableWithPagination({ 
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
          { title: "Status" },
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

export function BulkModal({isBulkModalOpen, closeBulkModal, bulkDelete}) {
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

export function TicketTableRow ({ ticket, selectedResources, updateFormState }) {
  // const bannerStatus = await getBannerStatusByTicketStatusId(ticket.statusState);
  // console.log('bannerStatus', bannerStatus);
  // console.log('statusState', ticket.statusState);
  return (
    <IndexTable.Row id={ticket.id} key={ticket.id} selected={selectedResources.includes(ticket.id)} position={ticket.id}>
    <IndexTable.Cell>
      {ticket.id}
    </IndexTable.Cell>
    <IndexTable.Cell>
      <Badge status={ticket.statusState}>{ticket.status.label}</Badge>
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
};

export const EmptyTicketState = () => (
  <EmptyState
    heading="Create a ticket"
    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
  >
    <p>Tickets will be displayed here.</p>
  </EmptyState>
);

export function truncate(str, { length = 25 } = {}) {
  if (!str) return "";
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}

export function EditButton({ticket, updateFormState}) {
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

export function DeleteButton({ ticket }) {
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

export function CollapsibleExample({ ticketImageUrls, setTicketImageUrls, isEdit }) {
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

export function RemovableImage({ ticketImageUrls, setTicketImageUrls }) {
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