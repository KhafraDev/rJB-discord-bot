const { Client, MessageEmbed } = require('discord.js');
const { MongoClient } = require('mongodb');
const cmp = require('semver-compare');
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
    const start = new Date().getTime();
    await Download();
    await Parse();
    console.log('Done updating packages in %d seconds!', (new Date().getTime() - start) / 1000);
}

setTimeout(update, 10); // run on start-up.
setInterval(update, 60 * 60 * 1000); // run every hour

KhafraClient.on('ready', Connect);
KhafraClient.on('message', async message => {
    if(message.author.bot) return;                                  // bot
    if(!message.guild || message.channel.type === 'dm') return;     // dm channels
    if(!message.guild.available) return;                            // service outages

    const db = (_db || await Connect()).db('cyrepo').collection('packages');
    if(message.content.match(/\[\[(.*)\]\]/g)) { /* Default search, "like" query */
        const n = message.content
            .match(/\[\[(.*)\]\]/)[1]
            .replace(/([^0-9a-zA-Z ])+/g, '\\\$1'); // escape all special characters

        const results = await db.find({
            $or: [
                { name: new RegExp(n, 'i') },
                { displayName: new RegExp(n, 'i') }
            ]
        }).toArray();
        
        if(!results.length) {
            return message.channel.send('No packages found.');
        }
            
        const m = await message.channel.send(
            'Which version would you like to search for?', 
            new MessageEmbed()
                .setTitle(`Found **${results.length}** Results!`)
                .setDescription(results.map((t, i) => `${i+1}. **${t.displayName}** | ${t.name}`)
                    .join('\n')
                    .slice(0, 1999)
                )    
        );

        return m.channel.createMessageCollector(
            _m => _m.author.id === message.author.id && !isNaN(_m.content), 
            { time: 15000, max: 2 }
        )
        .on('collect', async msg => {
            if(typeof results[Number(msg.content) - 1] === 'undefined') {
                return message.channel.send(`Invalid index "${msg.content}"`);
            }

            const latest = Object.keys(results[Number(msg.content) - 1].version)
                .map(n => n.replace(/\|/g, '.'))
                .sort(cmp)
                .pop();
            const r = results[Number(msg.content) - 1].version[latest.replace(/\./g, '|')];

            const hashes = Object.entries(r)
                .map(([k, v]) => ['MD5sum', 'SHA1', 'SHA256', 'SHA512'].includes(k) ? k + ': ' + v + '\n' : '')
                .join('')
                .trim();

            return message.channel.send(
                new MessageEmbed()
                .setTitle(`${r.Name} | ${r.Package}`)
                .setDescription(`\`\`\`${r.Description || ''}\`\`\``)
                .addField('Version', latest, true)
                .addField('Author', r.Author || r.Maintainer || 'N/A', true)
                .addField('Homepage', r.Homepage || 'N/A', true)
                .addField('Depiction', r.Depiction || r.SileoDepiction || 'N/A', false)
                .addField('Hashes', hashes.replace(/\s+/g, '').length ? hashes : 'N/A', true)
            );
        })
    }
});

KhafraClient.login('NTQxNDMwMTM0MjMwNDgyOTY3.XnGiAg.YVIZQQkzPF6_kGp0LqBOOJJ3aRY');