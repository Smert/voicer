const AGIServer = require('ding-dong');
const joi = require('@hapi/joi');
const Handler = require('./handler');
const Logger = require('./logger');
const RecognizerFactory = require('./recognize/recognizerFactory');

const configSchema = require('./configSchema');
const defaults = {
  agi: {
    port: 3000,
  },
  processing: {
    totalAttempts: 2,
    playGreeting: false,
    playBeepBeforeRecording: true, // use system beep
  },
  asterisk: {
    sounds: {
      onErrorBeforeFinish: 'invalid',
      onErrorBeforeRepeat: 'invalid',
      greeting: 'beep',
    },
    recognitionDialplanVars: {
      status: 'RECOGNITION_RESULT',
      text: 'RECOGNITION_TEXT',
    },
  },
  record: {
    directory: '/var/records/recognize',
    type: 'wav',
    duration: 3,
  },
  recognize: {
    directory: '/mnt/records',
    type: 'witai', // ['yandex', 'google', 'witai']
    options: {
      developer_key: '6SQV3DEGQWIXW3R2EDFUMPQCVGOEIBCR',
    },
  }
}

class Server {
  constructor(configIn) {
    this.config = Object.assign({}, defaults, configIn);

    const result = joi.validate(this.config, configSchema);
    if (result.error) {
      console.log('config error:', result.error);
      process.exit(1);
    }

    const logger = Logger({console: { colorize: true}});
    const recognizer = (RecognizerFactory(this.config['recognize'])).make();
    const handler = new Handler({recognizer, config: this.config, logger});

    this.agiServer = new AGIServer(handler.handle);
  }

  start() {
    const port = this.config.agi.port;
    this.agiServer.start(port);
    console.log('agi server started on port', port, 'with config', this.config);
  };
};

module.exports = Server;
