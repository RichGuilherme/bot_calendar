
import { Request, Response } from "express"
import { scheduleMessage } from "../services/bot-service"

export const botController = {
    sendMessage: async (req: Request, res: Response) => {
        try {
            scheduleMessage()
            res.send("Bot On")

        } catch (error) {
            console.error('Erro:', error)
        }
    }
}
