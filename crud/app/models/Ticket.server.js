import db from "../db.server";

export async function getTickets() {
    const tickets = await db.ticket.findMany({
        orderBy: { id: "desc" },
        include: {
            status: true,
        },
    });

    if (tickets.length === 0) return [];

    return Promise.all(
        tickets.map((ticket) => buildTicket(ticket))
    );
}

export async function getTicket(id) {
    id = parseInt(id);
    const ticket = await db.ticket.findFirst({ where: { id } });

    if (!ticket) {
        return null;
    }

    return buildTicket(ticket);
}

export async function getBannerStatusByTicketStatusId(id) {
    return "pending";
    id = parseInt(id);
    const ticket = await db.ticket.findFirst({ where: { id } });

    if (!ticket) {
        return null;
    }

    return buildTicket(ticket);
}

export async function deleteTicketsInBulk(selectedResources) {
    const ids = selectedResources.map((id) => {
        return parseInt(id);
    });
    console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', ids);
    const tickets = await db.ticket.deleteMany({
        where: {
            id: {
                in: ids,
            },
        },
    })
}

async function buildTicket(tickets) {
    return {
        ...tickets,
    };
}

export function validateData(data) {
    const errors = {};

    if (!data.title) {
    errors.title = "Title is required";
    }

    if (!data.content) {
    errors.content = "Content is required";
    }

    if (Object.keys(errors).length) {
    return errors;
    }
}