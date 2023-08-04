const {
    default: makeWASocket,
    delay,
    DisconnectReason,
    useMultiFileAuthState,
    jidDecode,
    makeInMemoryStore,
    downloadContentFromMessage
} = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const CFonts = require('cfonts')
const color = require('./lib/color')
const fs = require('fs')
const bot1 = require('./void')
const P = require('pino')
const app = require('express')()
const { imageSync } = require('qr-image')
const port = Number(process.env.PORT || Math.floor(Math.random() * (9000 - 3000) + 3000))
const { smsg } = require('./lib/myfunc')
const store = makeInMemoryStore({ logger: P().child({ level: 'fatal', stream: 'store' }) })

CFonts.say('VOID MD BY LEX CORP©', {
    font: 'block',
    align: 'center',
    gradient: ['blue', 'magenta']
})

console.log(color('[VOID]'), color('Void Bot is now online!', 'yellow'))
console.log(color('[DEV]', 'cyan'), color('Welcome back, Owner! Hope you are doing well~', 'magenta'))

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('session')

    const bot = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        browser: ['Void-Bot', 'fatal', '4.0.0'],
        auth: state
    })
    bot.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update
        if (qr) {
            app.get('/', async (req, res) => {
                res.contentType('image/png').send(imageSync(qr))
            })
            app.listen(port, () => console.log(`Server started on PORT: ${port}`))
        }
        if (connection == 'connecting') {
            console.log('Connecting to WhatsApp...')
        }
        if (connection === 'open') {
            console.log('Connected to WhatsApp')
        }
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output.statusCode
            if (reason !== DisconnectReason.loggedOut) {
                console.log('Connecting...')
                setTimeout(() => connectToWhatsApp(), 3000)
            } else {
                console.log('Disconnected. Deleting session')
                await fs.remove('session')
                console.log('Restarting...')
                setTimeout(() => connectToWhatsApp(), 3000)
            }
        }
    })

    bot.ev.on('creds.update', saveCreds)

    bot.decodeJid = (jid) => {
        if (!jid) return jid
        const decoded = jidDecode(jid) || {}
        return (decoded.user && decoded.server && `${decoded.user}@${decoded.server}`) || jid
    }

    bot.downloadMediaMessage = async (message) => {
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(message, messageType)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }

        return buffer
    }

    bot.ev.on('messages.upsert', async ({ messages }) => {
        let m = smsg(bot, messages[0], store)
        await bot1(bot, m, store)
    })

    bot.ev.on('group-participants.update', async (anu) => {
        console.log(anu)
        try {
            let metadata = await bot.groupMetadata(anu.id)
            let participants = anu.participants
            for (let num of participants) {
                grpmembernum = metadata.participants.length

                if (anu.action == 'add') {
                    let WAuserName = num
                    let bottext = `Welcome to |   *${metadata.subject}*   | \n\n@${
                        WAuserName.split('@')[0]
                    }\n\nHave fun with us✨\n\nGroup Description\n\n${metadata.desc}`
                    let buttonMessage = {
                        mentions: [num],
                        text: bottext
                    }
                    bot.sendMessage(anu.id, buttonMessage)
                } else if (anu.action == 'remove') {
                    let WAuserName = num
                    let astrotext = `GoodBye 👋, @${WAuserName.split('@')[0]} We wont miss you~!`
                    let buttonMessage = {
                        mentions: [num],
                        text: astrotext
                    }
                    bot.sendMessage(anu.id, buttonMessage)
                }
            }
        } catch (err) {
            console.log(err)
        }
    })

    bot.ev.on('CB:Blocklist', (json) => {
        if (blocked.length > 2) return
        for (let i of json[1].blocklist) {
            blocked.push(i.replace('c.us', 's.whatsapp.net'))
        }
    })
}

connectToWhatsApp()
