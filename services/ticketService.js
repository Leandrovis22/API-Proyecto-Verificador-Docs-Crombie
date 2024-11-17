const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class TicketService {
    async findPendingTicket(usuarioId) {
        return await prisma.tiqueteria.findFirst({
            where: {
                usuarioId,
                estado: {
                    in: ["pendiente"],
                },
            },
        });
    }

    async createTicket(usuarioId) {
        return await prisma.tiqueteria.create({
            data: {
                usuarioId,
                estado: "pendiente",
            },
        });
    }

    async updateTicketStatus(ticketId, estado, resultado, msqError = null) {
        return await prisma.tiqueteria.update({
            where: { id: ticketId },
            data: {
                estado,
                resultado,
                msqError
            },
        });
    }
}

module.exports = new TicketService();