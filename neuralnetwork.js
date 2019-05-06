//++ Neural Network ++//
function sig(x) {
    if (x > 0) return 1;
    return 0;
}

function sizedArray(width, defaultValue = 0) {
    var array = [];
    for (var i = 0; i < width; i++) { array.push(defaultValue); }
    return array;
}

function arrToStr(array) {
    var string = "";
    for (var i = 0; i < array.length; i++) {
        string += array[i].toString();
        if (i + 1 < array.length) string += ",";
    }
    return string;
}

function largestIndex(array) {
    var currentLargest = array[0];
    var currentIndex = 0;
    for (var i = 1; i < array.length; i++) {
        if (array[i] > currentLargest) {
            currentLargest = array[i];
            currentIndex = i;
        }
    }
    return currentIndex;
}

function removeElementFromArray(array, index) {
    var newArray = [];    
    for (var i = 0; i < array.length; i++) {
        if (i != index) newArray.push(array[i]);
    }
    return newArray;
}

class Node {
    constructor(strengths, layer, bias, output = 0) {
        this._strengths = strengths;
        this._layer = layer;
        this._bias = bias;
        this._output = output;
    }

    get strengths() { return this._strengths; }
    get bias() { return this._bias; }
    set bias(bias) { this._bias = bias; }
    get output() { return this._output; }

    mutateStrength(inputNode) {
        var newStrength = Math.random() - 0.5;
        this._strengths[inputNode] += newStrength;
        if (this._strengths[inputNode] > 1) this._strengths[inputNode] = 1;
        if (this._strengths[inputNode] < -1) this._strengths[inputNode] = -1;
    }

    setOutput(nestingNetwork) {
            var sum = this._bias;
            for (var i = 0; i < this._strengths.length; i++) {
                sum += nestingNetwork.layers[this._layer - 1][i].output * this._strengths[i];
            }
            this._output = sig(sum);
    }
}

class Network {
    constructor(widths) {
        this._layers = [];
        this._widths = widths.slice();
        this._outputs = [];
        for (var i = 0; i < this._widths.length; i++) { this._layers.push([]); }
    }

    get layers() { return this._layers; }
    get widths() { return this._widths; }
    get outputs() { return this._outputs; }

    createInputLayer(inputArray) {
        this._layers[0] = [];
        inputArray.forEach(bit => { this.addNode(false, 0, 0, bit); });
    }
    
    createHiddenLayers() {
        for (var layer = 1; layer < this._widths.length; layer++) {
            for (var width = 0; width < this._widths[layer]; width++) {
                this.addNode(sizedArray(this._widths[layer - 1]), layer, 0);
            }
        }
    }

    clone() {
        var clone = new Network(this._widths.slice());
        for (var i = 1; i < this._widths.length; i++) {
            for (var j = 0; j < this._widths[i]; j++) {
                clone.addNode(this._layers[i][j].strengths.slice(), i, this._layers[i][j].bias);
            }
        }
        return clone;
    }

    addNode(strengths, layer, bias, output = 0) {
        this._layers[layer].push(new Node(strengths, layer, bias, output));
    }

    fireLayer(layer) {
        for (var i = 0; i < this._widths[layer]; i++) {
            this._layers[layer][i].setOutput(this);
        }
    }

    runNetwork() {
        for (var i = 1; i < this._widths.length; i++) this.fireLayer(i);
        this._outputs = [];
        for (var i = 0; i < this._widths[this._widths.length - 1]; i++) {
            this._outputs.push(this._layers[this._widths.length - 1][i].output);
        }
    }

    exportNetwork() {
        var exportedNetwork = [];
        exportedNetwork.push(this._widths.length);
        for (var i = 0; i < this._widths.length; i++) {
            exportedNetwork.push(this._widths[i]);
        }
        for (var i = 1; i < this._layers.length; i++) {
            for (var j = 0; j < this._layers[i].length; j++) {
                exportedNetwork.push(this._layers[i][j].bias);
                for (var k = 0; k < this._layers[i][j].strengths.length; k++) {
                    exportedNetwork.push(this._layers[i][j].strengths[k]);
                }
            }
        }
        return exportedNetwork;
    }

    importNetwork(exportedNetwork) {
        this._outputs = [];
        this._widths = [];
        this._layers = [];
        var width = exportedNetwork.shift() + 1;
        for (var i = 1; i < width; i++) {
            this._widths.push(exportedNetwork.shift());
            this._layers.push([]);
        }
        for (var i = 1; i < this._widths.length; i++) {
            for (var j = 0; j < this._widths[i]; j++) {
                var nodeBias = exportedNetwork.shift();
                var nodeStrengths = [];
                for (var k = 0; k < this._widths[i - 1]; k++) {
                    nodeStrengths.push(exportedNetwork.shift());
                }
                this.addNode(nodeStrengths, i, nodeBias);
            }
        }
    }
}

function mutate(inputNetwork, mutationRate = 0.1) {
    network = inputNetwork.clone();
    for (var layer = 1; layer < network.widths.length; layer++) {
        for (var width = 0; width < network.widths[layer]; width++) {
            for (var connection = 0; connection < network.widths[layer - 1]; connection++) {
                if (Math.random() < mutationRate) network.layers[layer][width].mutateStrength(connection);
            }
            if (Math.random() < mutationRate) network.layers[layer][width].bias += Math.random() - 0.5;
        }
    }
    return network;
}
//-- Neural Network --//