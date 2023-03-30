import { Layer } from './layer';
import { Neuron } from './neuron';

export class NeuralNetwork {
  private layers: Layer[] = [];

  private numOfNeurons: number[];

  constructor(numOfNeurons: number[], layers?: Layer[]) {
    if (layers == undefined) {
      // Create new layers
      for (let numOfNeuronsForLayer of numOfNeurons) {
        this.layers.push(new Layer(numOfNeuronsForLayer));
      }
    } else {
      if (layers.length == numOfNeurons.length) {
        this.layers = layers;
      } else {
        console.warn(
          'The length of layers is different to the length of neurons',
        );
      }
    }

    this.numOfNeurons = numOfNeurons;
  }

  initRandomConnections() {
    for (let i = 1; i < this.layers.length; i++) {
      for (let neuron of this.layers[i].neurons) {
        neuron.initRandomConnectionsFromLayer(this.layers[i - 1]);
      }
    }
  }

  feedForward(inputs: number[]) {
    this.layers[0].setValues(inputs);
    for (let i = 1; i < this.layers.length; i++) {
      let layer = this.layers[i];
      layer.compute(this.layers[i - 1].getActivations());
    }

    return this.layers[this.layers.length - 1].getActivations();
  }

  mutate(rate: number) {
    for (let layer of this.layers) {
      layer.mutate(rate);
    }
  }

  deepCopy() {
    let layers: Layer[] = [];

    for (let i = 0; i < this.layers.length; i++) {
      let layer: Layer = new Layer(this.numOfNeurons[i]);
      let neurons: Neuron[] = [];
      for (let neuron of this.layers[i].neurons) {
        neurons.push(neuron.deepCopy());
      }

      if (i > 0) {
        //Connect to prev layer
        this.connectNeuronsToLayer(neurons, layers[i - 1]);
      }

      layer.neurons = neurons;
      layers[i] = layer;
    }

    return new NeuralNetwork(this.numOfNeurons, layers);
  }

  crossover(brain: NeuralNetwork) {
    let layers: Layer[] = [];

    for (let i = 0; i < this.layers.length; i++) {
      let layer = new Layer(this.numOfNeurons[i]);

      let crossOverPoint =
        (Math.random() * (this.layers[i].neurons.length - 1)) / 2 -
        (this.layers[i].neurons.length - 1) / 4;

      let neurons: Neuron[] = [];

      for (let j = 0; j < this.layers[i].neurons.length; j++) {
        let neuronCopy = this.layers[i].neurons[j].deepCopy();

        for (let k = 0; k < neuronCopy.weights.length; k++) {
          neuronCopy.weights[k] =
            j > crossOverPoint
              ? brain.layers[i].neurons[j].weights[k]
              : this.layers[i].neurons[j].weights[k];
        }

        neurons.push(neuronCopy);
      }

      if (i > 0) {
        //Connect to prev layer
        this.connectNeuronsToLayer(neurons, layers[i - 1]);
      }

      layer.neurons = neurons;
      layers.push(layer);
    }

    return new NeuralNetwork(this.numOfNeurons, layers);
  }

  private linearInterpolation(a: number, b: number, d: number) {
    return a + (b - a) * d;
  }

  private connectNeuronsToLayer(neurons: Neuron[], prevLayer: Layer) {
    for (let neuron of neurons) {
      neuron.prevNeurons = prevLayer.neurons;
    }
  }
}
