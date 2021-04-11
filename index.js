const Discord = require('discord.js');
const {
  prefix,
  token
} = require('./config.json');
const ytdl = require('ytdl-core');

const client = new Discord.Client();

const queue = new Map();


client.once('ready', () => {
  console.log('A punt!');
});
client.once('reconnecting', () => {
  console.log('Reconnectant!');
});
client.once('disconnect', () => {
  console.log('Desconnectat!');
});

client.on('message', async message => {
  if (message.author.bot) return;
  const serverQueue = queue.get(message.guild.id);


  if (message.content.startsWith("<:drip:")) {
    console.log("Drip");
    execute(message, serverQueue);
  }
  else if (message.content.startsWith(`${prefix}stop`) || message.content.startsWith("😩")) {
    stop(message, serverQueue);
  }
  console.log(message.content);
});

function stop(message, serverQueue) {
  if (!serverQueue)
    return message.channel.send("No hay ninguna canción");

  serverQueue.songs = [];
  if (serverQueue.connection) serverQueue.connection.dispatcher.end();
}

async function execute(message, serverQueue) {
  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) return;
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "No tengo permisos para entrar o hablar en tu canal de voz :("
    );
  }

  const songInfo = await ytdl.getInfo("https://www.youtube.com/watch?v=grd-K33tOSM");
  const song = {
    title: songInfo.videoDetails.title,
    url: songInfo.videoDetails.video_url,
  };
  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  }
  else {
    if (!message.guild.voice.channel) {
      try {
        var connection = await voiceChannel.join();
        serverQueue.connection = connection;
        play(message.guild, serverQueue.songs[0]);
      } catch (err) {
        console.log(err);
        queue.delete(message.guild.id);
        return console.log(err);
        //return message.channel.send(err);
      }
    }
  }


}


function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection.play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
}

client.login(token);
