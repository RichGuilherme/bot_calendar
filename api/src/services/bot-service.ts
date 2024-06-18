import TelegramBot from "node-telegram-bot-api"
import schedule from 'node-schedule'
import { TaskRepositories } from "../repository/tasks-repository"
import { ITask } from "../interfaces/task"
import { formatDate } from "../utils/formatDate"

const token = process.env.TOKEN_TELEGRAM as string
const bot = new TelegramBot(token, { polling: true })
const chatId = process.env.CHATBOT_ID as string

const sendMessageBot = async (name: string, day: Date, task: string): Promise<TelegramBot.Message> => {
    return await bot.sendMessage(chatId, `No próximo culto dia ${formatDate(day)}, ficará na projeção ${name} - ${task}`)
}

// Essa função serve para criar as regras de agendamento do scheduleJob, retornando um RecurrenceRule.
const ruleScheduleJob = (month: number, year: number, day: number): schedule.RecurrenceRule => {
    const rule = new schedule.RecurrenceRule()
    let date = new Date()

    rule.month = month 
    rule.date = day + 1
    rule.year = year
    rule.minute = 0

    if ((date.getDate() !== day) &&
        (date.getDay() == 6) &&
        (date.getHours() < 17)
    ) {
        rule.hour = 18
    } else {
        rule.hour = 15
    }

    return rule
}

const dateClosetsTask = async (taskDay: Date) => {
    const date = new Date(taskDay)
    let mouth: number;
    let year: number;
    let day: number;

    mouth = date.getMonth()
    year = date.getFullYear()
    day = date.getDate()

    return { mouth, year, day }
}


export const scheduleMessage = async () => {
    let taskValue: ITask | null = null

    try {
        taskValue = await TaskRepositories.getClosetsTask() as ITask
        if (!taskValue) {
            console.warn('No task found')
            return
        }

    } catch (err) {
        console.error('Error fetching task:', err)
        return
    }

    const { mouth, year, day } = await dateClosetsTask(taskValue!.Day)

    const job = schedule.scheduleJob(ruleScheduleJob(mouth, year, day), async () => {
        try {
            await sendMessageBot(taskValue!.Name, taskValue!.Day, taskValue!.Task)
            console.log("Mensagem agendada enviada")

            await TaskRepositories.deleteTasks(taskValue!.id)
            await scheduleMessage()

        } catch (error) {
            console.error('Erro ao enviar mensagem agendada:', error)
        }
    })
    
    console.log(job.nextInvocation())
}

scheduleMessage()