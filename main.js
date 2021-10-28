'use strict';

var svg = d3.select("#svg")
var dictionary = {};
var allWords = [];

var M_ENCODING_LEN = 100;
var NUM_TRACKS = tracks.length

// ================================= Utils ======================================
function createDictionary() {
    //   Oh no, p5 mangles the dictionary
    for (var index in raw_words) {
        let w = raw_words[index]

        let word = {
            word: w[0].toLowerCase(),
            freqS: w[1],
            freqW: w[2], // frequency "web"
            syllables: w[3].split(" "),
            vecP: w[6].split(" ").map(s => parseFloat(s)), // prononciation encoding
            vecM: w[7].split(" ").map(s => parseFloat(s)), // meaning encoding
        }
        dictionary[w[0].toLowerCase()] = word
        allWords.push(word)
    }

}

// Stolen from https://stackoverflow.com/a/57363600/6141684
function cosineSim(A, B) {
    let dotproduct = 0;
    let mA = 0;
    let mB = 0;
    for (let i = 0; i < A.length; i++) {
        dotproduct += (A[i] * B[i]);
        mA += (A[i] * A[i]);
        mB += (B[i] * B[i]);
    }
    mA = Math.sqrt(mA);
    mB = Math.sqrt(mB);
    var similarity = (dotproduct) / ((mA) * (mB))
    return similarity;
}

function meaningSim(word1, word2) {
    return cosineSim(dictionary[word1]["vecM"], dictionary[word2]["vecM"])
}

function wordVectorSim(word, encoding) {
    return cosineSim(dictionary[word]["vecM"], encoding)
}

function meanEncoding(lyricString) {
    let words = lyricString.replace("'s", "").split(" ")

    let acc = words.reduce(function (a, b) {
        let v = dictionary[b]
        if (v) {
            return math.add(a, v["vecM"]);
        }
        return a;
    }, Array.from({ length: M_ENCODING_LEN }, () => 0))

    let count = words.length
    return math.divide(acc, count)
}

function addMeanEncodingsToTracks() {
    tracks = tracks.map((track) => {
        track["encoding"] = meanEncoding(track["lyrics"])
        return track
    })
}

function calculateTrackDistances(words) {
    let v = tracks.map((track) => {
        let simMap = words.map((word) => wordVectorSim(word, track["encoding"]))
        let sim = { "sim": simMap }
        return { ...sim, ...track }
    })
    // v.sort((a, b) => b["sim"] - a["sim"])
    return v
}
var category20 = [
    "rgb(31, 119, 180)",
    "rgb(174, 199, 232)",
    "rgb(255, 127, 14)",
    "rgb(255, 187, 120)",
    "rgb(44, 160, 44)",
    "rgb(152, 223, 138)",
    "rgb(255, 152, 150)",
    "rgb(148, 103, 189)",
    "rgb(197, 176, 213)",
    "rgb(140, 86, 75)",
    "rgb(196, 156, 148)",
    "rgb(227, 119, 194)",
    "rgb(247, 182, 210)",
    "rgb(127, 127, 127)",
    "rgb(199, 199, 199)",
    "rgb(188, 189, 34)",
    "rgb(219, 219, 141)",
    "rgb(23, 190, 207)",
    "rgb(158, 218, 229)"
]

function createAlbumColorMap() {
    let uniqueAlbums = [...new Set(tracks.map((track) => track.album))]
    let map = {}
    for (let i = 0; i < uniqueAlbums.length; i++) {
        map[uniqueAlbums[i]] = category20[i]
    }
    return map
}

// ================================= Doodles ======================================

// ================================= tooltip ======================================
var tooltipDiv = d3.select("body").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);

function updateTooltip(event, d) {
    // console.log()
    tooltipDiv.transition()
        .duration(200)
        .style("opacity", .9);
    tooltipDiv
        .style("background", "lightgrey")
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY - 28) + "px");
    if (d.special) {
        tooltipDiv.html("")
        tooltipDiv.style("display", "none")
        // tooltipDiv.html(landmarkWords[d.index - NUM_TRACKS])
    } else {
        let track = tracks[d.index]
        tooltipDiv.html(track.title + "<br>" + track.album)
        tooltipDiv.style("display", "block")
    }
}
// ================================= main ======================================

createDictionary()
addMeanEncodingsToTracks()
var albumColorMap = createAlbumColorMap()

var landmarkWords = ["love", "hate"];

var link;
var node;
var circles;
var labels;

var width = 800;
var height = 700;

svg
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

function doMain(){
    // Clean up
    svg.html("")

    // Start for real
    var distances = calculateTrackDistances(landmarkWords)

    var nodes = Array.from({ length: NUM_TRACKS + landmarkWords.length }, (v, i) => {
        let node = {
            "index": i,
            "special": false
        }
        return node
    })

    for (let i = 0; i < landmarkWords.length; i++) {
        nodes[NUM_TRACKS + i]["special"] = true
        // nodes[NUM_TRACKS + i]["x"] = 0;
        // nodes[NUM_TRACKS + i]["y"] = 0;
    }

    var links = []
    for (let i = 0; i < landmarkWords.length; i++) {
        for (let trackIndex = 0; trackIndex < NUM_TRACKS; trackIndex++){
            let link = {
                "source": trackIndex,
                "target": NUM_TRACKS + i,
                "word2word": false
            }
            links.push(link)
        }
    }

    for (let i = 0; i < landmarkWords.length; i++) {
        for (let j = 0; j < landmarkWords.length; j++) {
            if (i != j) {
                let link = {
                    "source": i + NUM_TRACKS,
                    "target": j + NUM_TRACKS, 
                    "word2word": true,
                }
                links.push(link)
            }
        }
   }

    var forceLink = d3.forceLink(links)
        .distance((link) => {
            // console.log(link)
            let d = 0;
            if (link.word2word) {
                d = 1 - meaningSim(landmarkWords[link.source.index - NUM_TRACKS], landmarkWords[link.target.index - NUM_TRACKS])
                // console.log(landmarkWords[link.source.index - NUM_TRACKS], landmarkWords[link.target.index - NUM_TRACKS], d)
            } else {
                d = 1 - distances[link.source.index]["sim"][link.target.index - NUM_TRACKS]
            }
            let distance = 5 + (400 * (d * d))
            return distance
        })
    // .strength(1)

    var forceNode = d3.forceManyBody()
        .strength(-50)

    var force = d3.forceSimulation(nodes)
        .force("link", forceLink)
        .force("center", d3.forceCenter())
        .force("charge", forceNode)
        .on("tick", () => {
            ticked()
        })
    // .stop()


    // ================================= main d3 stuff ======================================


    link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-width", 1)
        .attr("opacity", 0.1)
        .selectAll("line")
        .data(links)
        .join("line");

    node = svg.append("g")
        .attr("fill", "red")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .call(drag(force))
    
    circles = node.append("circle")
        .attr("r", (d) => {
            if (d.special) {
                return 20;
            }
            return 5;
        })
        .attr("fill", (d) => {
            if (d.special) {
                return "red"
            } else {
                return albumColorMap[tracks[d.index]["album"]]
            }
        })
        .on("mouseover", (event, d) => {
            updateTooltip(event, d)
        })

    labels = node.append("text")
        .text((d) => {
            if (d.special) {
                return landmarkWords[d.index - NUM_TRACKS]
            }
            return ""
        })
        .attr("x", -10)
        .attr("y", 5)
        .attr("fill", "black")
}

function ticked() {
    link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    node
        .attr("transform", d => "translate(" + d.x +"," + d.y + ")")
        // .attr("y", d => d.y);
}

function drag(simulation) {    
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    
    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }


// ================================= UI / tag editor ======================================
var actionTypeTagEditor;
function initializeTagEditor(){
    actionTypeTagEditor = $('#action-type-tag-area').tagEditor({
        forceLowercase : false,
        sortable: false,
        initialTags: landmarkWords,
        beforeTagSave: (field, editor, tags, tag, val) => {
            // console.log(field, editor, tags, tag, val)
            if (!dictionary.hasOwnProperty(val)){
                return false;
            }
        },
        onChange: (field, editor, tags) => {
            landmarkWords = tags
            doMain()
        }
    })
}
initializeTagEditor();

doMain()
