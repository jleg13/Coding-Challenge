# JavaScript Technical Challenge

## Semantic structure from heading elements and semantic-structural incongruence in web pages

## Description:

- The goal of this challenge is to identify the semantic structure of a web page from the heading elements in the page.
- In my solution I aimed traverse the DOM in the most efficient way I could to firstly scrape the heading elements and then traverse the whole DOM searching for the structual elements. The BFS allows a systematic layer by layer analysis of finding structual elements and headings at each hierarchical level. BFS will be a computation complexity of O(n). 

Frameworks include:

- Axios library is used to make the web request to the url 
- Cheerio parses the retrieved html and allows it to be traversed (lighter weight option over others like puperteer and jsdom). However to perform the same task on dynamically generated sites Puperteer would be a better option.

## Built With:

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![NPM](https://img.shields.io/badge/NPM-%23000000.svg?style=for-the-badge&logo=npm&logoColor=white)

## Requirments:
To run you need [node.js](https://nodejs.org/en/)

## Instructions:
- Clone repository cd into the directory and run the commands:

    ```npm install```

    and then:

    ```npm start```
    
- Open up a browser and go to: http://localhost:8000?u=*URL*
  replacing **URL** with your desired url to perform analysis

- In the test folder I have a html that is the structure of the challenges example, this can be run on a localhost (here my VScode had live server open on 5500) so I could test using the following url:
  http://localhost:8000?u=http://127.0.0.1:5500/tests/mocksite.html

### Background (Detailed explanation of the challenge):

In web pages, heading elements (`h1-h6`) are used to impose semantic structure on the content appearing in the page. They can be used to break an article into chapters or sections, with `h1` being a top-level heading, `h2` being the heading one level down and so on. In other words the semantics of the heading elements arise from the weight they carry in relation to one another. However, there is no explicit containment hierarchy between these headings. Thus, it is the responsibility of the page author or generator to use heading elements in a semantically appropriate way.

One "problem" that arises is skipping heading levels. For example, going from `h2` to `h4` without a `h3` in between. While this is also valid HTML, [it isn't best practice](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements#Usage_notes).

Often, heading elements appear within the context of structural elements, such as `<div>` elements that have no real semantics attached to them, or structural elements, such as `<section>`, which *do* carry meaning within the structure of a web page. Sometimes, an incongruence or conflict emerges between the innate semantics of the heading elements and imposed semantics due to the use of nested structural elements. As the HTML Standard [notes](https://html.spec.whatwg.org/multipage/sections.html#headings-and-sections):

>Sections may contain headings of any rank, but authors are strongly encouraged to either use only h1 elements, or to use elements of the appropriate rank for the section's nesting level.

For instance, consider this simple scenario:

```
<section>
  <h2>Heading 2</h2>
  <h3>Heading 3</h3>
  <section>
    <h2>Another Heading 2</h2>
  </section>
</section>
```

This is perfectly valid HTML, but semantically, it's confused because we have a `h2` element nested at a deeper level than a `h3` element that precedes it.

These problems have a number of potential implications, including in the areas of SEO, machine translation from HTML to other formats, accessibility, automatic summarisation, and generation of tables of contents.

### Challenge

Your challenge, should you choose to accept it, is two-fold:
1. Extract the semantic structure of any web page implied by heading elements `h1-h6`. The result should be a, possibly multi-rooted, tree structure. For example, the sequence `h1`, `h2`, `h2`, `h3`, `h4`, `h2`, `h5` yields the tree `[h1, [h2, h2, [h3, [h4]], h2, [h5]]]` assuming a pre-ordered notation. Represent each heading as a node in a tree where each node consists of a tag, content and children, like `{"tag": "h1", "content": "Heading 1", "children": []`, where the list of children contains nodes of the same form. When a heading level is skipped, for example going from `h2` to `h4`, add the pair of headings on either side of the skipped levels as a tuple to an array. For this part of the task you can ignore any other elements in the page.
1. Check the extracted semantic structure against the actual containment structure of the page, adding to an array any heading element that deviates from the guideline given in the HTML spec "to either use only h1 elements, or to use elements of the appropriate rank for the section's nesting level". For example, if the above heading sequence is shown in the context of the following structure:
```
<section>
  <h1/>
  <section>
    <h2/>
    <h2/>
    <section>
      <h3/>
      <section>
        <h4/>
        <section>
          <h2/>
          <h5/>
        </section>
      </section>
    </section>
   </section>
 </section> 
```
The final `h2` element would be added to the array because the container structure puts that `h2` element in a nested position relative to the position of the `h4` element that precedes it, despite the `h2` element carrying more semantic weight. Use the same object representation as above.

Structure your code so that it can be run as a:
1. standalone command on the command line, where the URL to process is given as an argument, e.g., `checkheadings https://foo.com`
1. little web app that takes a URL as a URL parameter, e.g., `http://localhost:8000?u=https://foo.com`

In both cases, the result should be a well-formed JSON object encapsulating the outputs of the two parts of the task above. For example, given the above example, the response might look something like this:
```
{
  "semantic-structure": 
  [
    {"tag": "h1",
      "content": "Heading 1",
      "children": 
      [
        {"tag": "h2",
         "content": "Heading 2"
        },
        {"tag": "h2",
         "content": "Another Heading 2",
         "children": 
         [
           {"tag": "h3",
            "content": "Heading 3",
            "children": 
            [
              {"tag": "h4",
               "content": "Heading 4"
              }
            ]
           }
         ]
        },
        {"tag": "h2",
         "content": "An out of place Heading 2",
         "children": 
         [
           {"tag": "h5",
            "content": "Heading 5"
           }
         ]
        }
      ]
    }
  ],
  "skipped-levels": [
    {"tag": "h2", "content": "An out of place Heading 2"}, {"tag": "h5", "content": "Heading 5"}
  ],
  "incongruent-headings": [
    {"tag": "h2", "content": "An out of place Heading 2"}
  ]
}
```

Error conditions, such as a malformed URL given as argument, should be reported appropriately for both command-line and web API invocations.

Add a description of your approach to the bottom of this README, including a note about the computation complexity of your solution. Your description should also include instructions for running your solution in web app and command line form.
