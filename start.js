const { default: makeWASocket, delay, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom')
const CFonts = require('cfonts');
const color = require('./lib/color');
const { imageSync } = require('qr-image')
const fs = require('fs');
const axios = require('axios');
const bot1 = require('./void');
const pino = require('pino');
const path = require('path');
const { Collection } = require('./lib');
const Economy = new Collection();
const blocked = [];

CFonts.say('VOID MD BY LEX CORP©', {
  font: 'block',
  align: 'center',
  gradient: ['blue', 'magenta'],
});

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

readline.question(`ENTER LOGIN: `, async (name) => {
  console.log(`LOGGING ON ${name}! to port -> ws://localhost:6000`);
  readline.close();

  console.log(color('[VOID]'), color('Void Bot is now online!', 'yellow'));
  console.log(color('[DEV]', 'cyan'), color('Welcome back, Owner! Hope you are doing well~', 'magenta'));

  const readEconomy = () => {
      let dir = path.join(__dirname, './economy');
      let dirs = fs.readdirSync(dir);
      let cmdlist = {};
      try {
        dirs.forEach(async (res) => {
          let groups = res.toLowerCase();
          Economy.category = dirs.filter((v) => v !== '_').map((v) => v);
          cmdlist[groups] = [];
          let files = fs.readdirSync(`${dir}/${res}`).filter((file) => file.endsWith('.js'));
          for (const file of files) {
            const game = require(`${dir}/${res}/${file}`);
            cmdlist[groups].push(game);
            Economy.set(game.name, game);
            delay(100);
          }
        });
        Economy.list = cmdlist;
      } catch (eerror) {
        console.error('An error occurred!');
      }
  }

  async function connectToWhatsApp() {
const { state, saveCreds } = await useMultiFileAuthState(`session/${name}`);
    
    const bot = makeWASocket({
      logger: pino({ level: 'silent' }),
      printQRInTerminal: true,
      browser: ['Void-Bot', 'fatal', '4.0.0'],
      auth: state,
    });

    readEconomy();
    bot.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update
            if (connection == 'connecting') {
                console.log('Connecting to WhatsApp...')
            }
            if (connection === 'open') {
                console.log('Connected to WhatsApp')
            }
            if (connection === 'close') {
                let reason = new Boom(lastDisconnect?.error)?.output.statusCode
                console.log(`Connection closed: ${reason}`)
                if (reason === DisconnectReason.loggedOut) {
                    await fs.remove('session')
                }
              connectToWhatsApp()
            }
        })
    
   bot.ev.on('creds.update', saveCreds) 

  bot.ev.on('messages.upsert', async (mek) => {
      msg = mek.messages[0];
      mek = mek.messages[0];
      bot1(bot, msg, mek);
    });

    bot.ev.on('group-participants.update', async (anu) => {
      console.log(anu);
      try {
        let metadata = await bot.groupMetadata(anu.id);
        let participants = anu.participants;
        for (let num of participants) {
          grpmembernum = metadata.participants.length;

          if (anu.action == 'add') {
            let WAuserName = num;
            let bottext = `Welcome to |   *${metadata.subject}*   | \n\n@${WAuserName.split('@')[0]}\n\nHave fun with us✨\n\nGroup Description\n\n${metadata.desc}`;
            let buttonMessage = {
              mentions: [num],
              text: bottext,
            };
            bot.sendMessage(anu.id, buttonMessage);
          } else if (anu.action == 'remove') {
            let WAuserName = num;
            let astrotext = `GoodBye 👋, @${WAuserName.split('@')[0]} We wont miss you~!`;
            let buttonMessage = {
              mentions: [num],
              text: astrotext,
            };
            bot.sendMessage(anu.id, buttonMessage);
          }
        }
      } catch (err) {
        console.log(err);
      }
    });

    bot.ev.on('CB:Blocklist', (json) => {
      if (blocked.length > 2) return;
      for (let i of json[1].blocklist) {
        blocked.push(i.replace('c.us', 's.whatsapp.net'));
      }
    });
  }
  connectToWhatsApp();
});
