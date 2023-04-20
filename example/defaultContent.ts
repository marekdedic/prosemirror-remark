export const defaultContent = "\n\
# h1 Heading 8-)\n\
## h2 Headin\n\
### h3 Heading\n\n\n\
#### h4 Heading\n\
##### h5 Heading\n\
###### h6 Heading\n\
\n\
\n\n\n\
## Horizontal Rules\n\
\n\
___\n\
\n\
---\n\
\n\
***\n\
\n\
## Emphasis\n\
\n\
**This is bold text**\n\
\n\
__This is bold text__\n\
\n\
*This is italic text*\n\
\n\
_This is italic text_\n\
\n\
~~Strikethrough~~\n\
\n\
\n\
## Blockquotes\n\
\n\
\n\
> Blockquotes can also be nested...\n\
>> ...by using additional greater-than signs right next to each other...\n\
> > > ...or with spaces between arrows.\n\
\n\
\n\
## Lists\n\
\n\
Unordered\n\
\n\
+ Create a list by starting a line with `+`, `-`, or `*`\n\
+ Sub-lists are made by indenting 2 spaces:\n\
  - Marker character change forces new list start:\n\
    * Ac tristique libero volutpat at\n\
    + Facilisis in pretium nisl aliquet\n\
    - Nulla volutpat aliquam velit\n\
+ Very easy!\n\
\n\
Ordered\n\
\n\
1. Lorem ipsum dolor sit amet\n\
2. Consectetur adipiscing elit\n\
3. Integer molestie lorem at massa\n\
\n\
\n\
1. You can use sequential numbers...\n\
1. ...or keep all the numbers as `1.`\n\
\n\
Start numbering with offset:\n\
\n\
57. foo\n\
1. bar\n\
\n\
\n\
## Code\n\
\n\
Inline `code`\n\
\n\
Indented code\n\
\n\
    // Some comments\n\
    line 1 of code\n\
    line 2 of code\n\
    line 3 of code\n\
\n\
\n\
Block code \n\"fences\n\"\n\
\n\
```\n\
Sample text here...\n\
```\n\
\n\
## Tables\n\
\n\
| Option | Description |\n\
| ------ | ----------- |\n\
| data   | path to data files to supply the data that will be passed into templates. |\n\
| engine | engine to be used for processing templates. Handlebars is the default. |\n\
| ext    | extension to be used for dest files. |\n\
\n\
Right aligned columns\n\
\n\
| Option | Description |\n\
| ------:| -----------:|\n\
| data   | path to data files to supply the data that will be passed into templates. |\n\
| engine | engine to be used for processing templates. Handlebars is the default. |\n\
| ext    | extension to be used for dest files. |\n\
\n\
\n\
## Links\n\
\n\
[link text](http://dev.nodeca.com)\n\
\n\
[link with title](http://nodeca.github.io/pica/demo/ \n\"title text!\n\")\n\
\n\
Autoconverted link https://github.com/nodeca/pica (enable linkify to see)\n\
\n\
\n\
## Images\n\
\n\
![Minion](https://octodex.github.com/images/minion.png)\n\
![Stormtroopocat](https://octodex.github.com/images/stormtroopocat.jpg \n\"The Stormtroopocat\n\")\n\
\n\
Like links, Images also have a footnote style syntax\n\
\n\
![Alt text][id]\n\
\n\
With a reference later in the document defining the URL location:\n\
\n\
[id]: https://octodex.github.com/images/dojocat.jpg  \n\"The Dojocat\n\"\n\
\n\
";
