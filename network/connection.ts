import { Neuron } from "./neuron";

export class Connection{
    constructor(public weight: number = 1, public prevNeuron: Neuron, public nextNeuron: Neuron){

    }

    getConnectionActivation(){
        return this.prevNeuron.activation * this.weight;
    }
}