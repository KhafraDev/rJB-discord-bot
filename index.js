const { Client, MessageEmbed } = require('discord.js');
const { MongoClient } = require('mongodb');
const Download = require('cyrepo/src/download');
const Parse = require('cyrepo/src/parse');

const KhafraClient = new Client();

let _db;
const Connect = async () => {
    if(!_db) {
        _db = await MongoClient.connect('mongodb://localhost:27017/', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    } else {
        return _db;
    }
}

const update = async () => {
    await Download();
    await Parse();
    console.log('Done updating packages!');
}

setTimeout(update, 10); // run on start-up.
setInterval(update, 60 * 60 * 1000); // run every hour

KhafraClient.on('ready', Connect);
KhafraClient.on('message', async message => {
    const db = (_db || await Connect()).db('cyrepo').collection('packages');
    if(message.content.match(/\[\[(.*)\]\]/g)) { /* Default search, "like" query */
        const n = message.content.match(/\[\[(.*)\]\]/)[1];

        const results = await db.find({
            $or: [
                { name: new RegExp(n, 'i') },
                { displayName: new RegExp(n, 'i') }
            ]
        }).toArray();
        
        if(!results.length) {
            return message.channel.send('No packages found.');
        }

        const embed = new MessageEmbed()
            .setTitle(`${results[0].displayName} | ${results[0].name}`)
            .setDescription(`Found **${Object.keys(results[0].version).length}** versions.\n${Object.keys(results[0].version).map(e => e.replace(/\|/g, '.')).join('\n')}`);
        return message.channel.send(embed);
    }
});

KhafraClient.login('');