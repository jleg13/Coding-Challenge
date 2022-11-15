/**
 * Module to perform web scrape, and semantic analysis on the html
 */
/******************************************************************************/
const cheerio = require("cheerio");
const axios = require("axios").default;
const HTML_HEADINGS = ["h1", "h2", "h3", "h4", "h5", "h6"];
const structuralElements = ["div", "article", "aside", "nav", "section"];
const headingError = (node) => {
  return {
    tag: node.tag,
    content: node.content,
  };
};
/******************************************************************************/
/**
 * Node and tree class used to represent the semantic stucture
 */
class Node {
  constructor(tag, content) {
    this.tag = tag;
    this.content = content;
    this.children = [];
  }
}
class Tree {
  constructor(root) {
    this.root = root;
  }
  // method to add a node to the correct level of the tree
  addNode(node, level) {
    let parent = this.root;
    for (let i = 0; i < level; i++) {
      parent = parent.children[parent.children.length - 1];
    }
    parent.children.push(node);
  }
}
/******************************************************************************/
/**
 * Queue class to use in the breadth first search tree traversal of the html and collecing heading order in scrape
 */
class Queue {
  constructor() {
    this.q = [];
  }
  send(item) {
    this.q.push(item);
  }
  receive() {
    return this.q.shift();
  }
}
/******************************************************************************/
/**
 * Function to perform a breadth first search on the html to find incongruent headings
 * @param {*} html the root html to search
 * @param {*} elements the structural elements to search for
 * @returns
 */
function traverseHTML(html, elements) {
  let htmlQueue = new Queue();
  let incongruent = [];
  let expectedLevel = 0;
  let nodesAtCurrentLevel = 1;
  let nodesAtNextLevel = 0;
  let isStructual = false;
  let isHeading = false;

  // start queues
  htmlQueue.send(html);

  // search through all nodes
  while (htmlQueue.q.length > 0) {
    let currentNode = htmlQueue.receive();
    isHeading = HTML_HEADINGS.includes(currentNode.name);
    isStructual = elements.includes(currentNode.name);
    if (isStructual) {
      moveLevels = true;
    }

    // if the current node is a heading check if it is correct type
    if (isHeading) {
      let headingValue = Number(currentNode.name[1]);
      // if the heading is greater then its nested position or not 'h1'
      if (
        headingValue < expectedLevel ||
        (headingValue < expectedLevel && headingValue !== 1)
      ) {
        let incongruentNode = {
          tag: currentNode.name,
          content: currentNode.children[0].data,
        };
        incongruent.push(incongruentNode);
      }
    }
    // identify the next level children
    if (currentNode.children.length > 0) {
      for (let i = 0; i < currentNode.children.length; i++) {
        if (currentNode.children[i].type === "tag") {
          htmlQueue.send(currentNode.children[i]);
          nodesAtNextLevel += 1;
        }
      }
    }
    // track the status of the breadth search
    if (nodesAtCurrentLevel === 1) {
      // reached the end of the current level
      nodesAtCurrentLevel = nodesAtNextLevel;
      nodesAtNextLevel = 0;

      // check if any elements in the finished level were structural/heading elements
      if (isStructual || isHeading) {
        isStructual = false;
        isHeading = false;
        expectedLevel += 1;
      } else if (isStructual && !isHeading) {
        isStructual = false;
      } else if (!isStructual && isHeading) {
        isHeading = false;
        expectedLevel += 1;
      }
    } else {
      nodesAtCurrentLevel -= 1;
    }
  }
  return incongruent;
}
/******************************************************************************/
module.exports = {
  scrapeHeadings: async (url) => {
    let structure = {};
    await axios
      .get(url)
      .then((html) => {
        //load the html into cheerio
        const $ = cheerio.load(html.data);
        let headingQueue = new Queue();
        let skippedLevels = [];
        let nestingLevel = 1;
        let prevNode = null;
        // create a queue of ordered headings
        $("h1, h2, h3, h4, h5, h6").each((i, el) => {
          let heading = new Node(el.name, el.children[0].data);
          headingQueue.send(heading);
        });
        // create tree adding the root element
        let semanticStructure = new Tree(headingQueue.receive());
        // check if root is the correct h1 tag
        if (semanticStructure.root.tag !== "h1") {
          let skipped = [headingError(semanticStructure.root)];
          skippedLevels.push(skipped);
          nestingLevel = Number(semanticStructure.root.tag[1]);
        }
        // add the rest of the nodes in the queue to the tree
        while (headingQueue.q.length > 0) {
          let currentNode = headingQueue.receive();
          let headingValue = Number(currentNode.tag[1]);
          if (headingValue === nestingLevel + 1 || headingValue === 1) {
            // child on new nesting level
            semanticStructure.addNode(currentNode, nestingLevel - 1);
            nestingLevel += 1;
          } else if (headingValue === nestingLevel) {
            // sibling on same nesting level
            semanticStructure.addNode(currentNode, nestingLevel - 2);
          } else if (headingValue > nestingLevel + 1) {
            // child on skipped level
            semanticStructure.addNode(currentNode, nestingLevel - 1);
            nestingLevel += 1;
            let skipped = [headingError(prevNode), headingError(currentNode)];
            skippedLevels.push(skipped);
          } else {
            // tag is out of order
            semanticStructure.addNode(currentNode, headingValue - 2);
            nestingLevel = headingValue;
          }
          prevNode = currentNode;
        }
        //add semantic findings to object
        structure.semanticStructure = semanticStructure;
        structure.skippedLevels = skippedLevels;
      })
      .catch(() => {
        throw new Error("Error scraping page");
      });
    return structure;
  },
  structureAnalysis: async (url, structure) => {
    await axios
      .get(url)
      .then((html) => {
        // load the html into cheerio
        const $ = cheerio.load(html.data);
        let incongruentHeadingsArr = [];
        let root = $("html");
        root.children().each((i, el) => {
          // breadth first search to find the incongruent headings
          if (el.name === "body") {
            let incon = traverseHTML(el, structuralElements);
            incongruentHeadingsArr.push.apply(incongruentHeadingsArr, incon);
          }
        });
        structure.incongruentHeadings = incongruentHeadingsArr;
      })
      .catch(() => {
        throw new Error("Error analysing page structure");
      });

    return structure;
  },
};
/********************************************************************************/
