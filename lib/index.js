const Stream				= require('stream')
const File					= require('fs')
const Path					= require('path')
const SnowboyDetectNative	= require('../build/Release/snowboy.node').SnowboyDetect

const ModelType = {
	PMDL: 'personal',
	UMDL: 'universal'
}

const DetectionResult = {
  SILENCE: -2,
  ERROR: -1,
  SOUND: 0
}

class SnowboyModel {
	constructor(options) {
		options || (options = {})

		if ( !options.file ) {
			throw new Error('Missing model filename')
		}
		this.file			= options.file
		this.sensitivity	= options.sensitivity || '0.5'
		this.hotwords		= [].concat(options.hotwords)
	}
}

class SnowboyModels {
  constructor() {
  	this.models = []
  	this.lookupTable = []
  }

  add(model) {
	if ( File.existsSync(model.file) === false ) {
		throw new Error(`Model ${model.file} does not exists.`);
	}

	const type = Path.extname(model.file).toUpperCase();

	if (ModelType[type] === ModelType.PMDL && model.hotwords.length > 1) {
		throw new Error('Personal models can define only one hotword.');
	}

	this.models.push(model);
	this.lookupTable = this.generateModelsLookupTable();
  }

  get modelString() {
    return this.models.map((model) => model.file).join();
  }

  get sensitivityString() {
    return this.models.map((model) => model.sensitivity).join();
  }

  lookup(index) {
    const lookupIndex = index - 1;
    if (lookupIndex < 0 || lookupIndex >= this.lookupTable.length) {
      throw new Error('Index out of bounds.');
    }
    return this.lookupTable[lookupIndex];
  }

  numHotwords() {
    return this.lookupTable.length;
  }

  generateModelsLookupTable() {
    return this.models.reduce((hotwords, model) => {
      return hotwords.concat(model.hotwords);
    }, []);
  }
}

class SnowboyDetector extends Stream.Writable {
	constructor(resources, options) {
		super()

		options || (options = {})
		this.models = options.models
		this.nativeInstance = new SnowboyDetectNative(resources, this.models.modelString)

		if (this.nativeInstance.NumHotwords() !== this.models.numHotwords()) {
	      throw new Error('Loaded hotwords count does not match number of hotwords defined.');
	    }
	    this.nativeInstance.SetSensitivity(options.models.sensitivityString);

	    if (options.audioGain) {
	      this.nativeInstance.SetAudioGain(options.audioGain);
	    }

	    if (options.applyFrontend) {
	      this.nativeInstance.ApplyFrontend(options.applyFrontend);
	    }

	    if (options.highSensitivity) {
	      this.nativeInstance.SetHighSensitivity(options.highSensitivity);
	    }
	}

	_write(chunk, encoding, callback) {
		this.runDetection(chunk)
		return callback();
	}

	reset() {
	    return this.nativeInstance.Reset();
	}

	runDetection(chunk) {
		const index = this.nativeInstance.RunDetection(chunk);
		this.processDetectionResult(index, chunk);
		return index
	}

	setSensitivity(sensitivity) {
	    this.nativeInstance.SetSensitivity(sensitivity);
	}

	setHighSensitivity(highSensitivity) {
	    this.nativeInstance.SetHighSensitivity(highSensitivity);
	}

	getSensitivity() {
	    return this.nativeInstance.GetSensitivity();
	}

	setAudioGain(gain) {
	    this.nativeInstance.SetAudioGain(gain);
	}

	updateModel() {
	    this.nativeInstance.UpdateModel();
	}

	numHotwords() {
	    return this.nativeInstance.NumHotwords();
	}

	sampleRate() {
	    return this.nativeInstance.SampleRate();
	}

	numChannels() {
	    return this.nativeInstance.NumChannels();
	}

	bitsPerSample() {
	    return this.nativeInstance.BitsPerSample();
	}

	processDetectionResult(index, buffer) {
		switch (index) {
			case DetectionResult.ERROR:
				this.emit('error');
				break;

			case DetectionResult.SILENCE:
				this.emit('silence');
				break;

			case DetectionResult.SOUND:
				this.emit('sound', buffer);
				break;

			default:
				const hotword = this.models.lookup(index);
				this.emit('hotword', index, hotword, buffer);
				break;
		}
  }
}

module.exports = {
	SnowboyModel,
	SnowboyModels,
	SnowboyDetector
}