const fs = require("fs");
const path = require("path");
const { parseStringPromise } = require("xml2js");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} = require("docx");

const XML_FILE = path.join(__dirname, "BaoCao_Tuan1.xml");
const OUTPUT_FILE = path.join(__dirname, "BaoCao_Tuan1.docx");

async function main() {
  const xmlContent = fs.readFileSync(XML_FILE, "utf-8");
  const result = await parseStringPromise(xmlContent, { explicitArray: false });
  const doc = result.document;

  const children = [];

  // doc có thể chứa heading, paragraph, list theo thứ tự
  // xml2js parse ra object, nhưng nếu có nhiều tag cùng tên thì thành array
  // Ta cần duyệt theo thứ tự xuất hiện trong XML, nên parse lại bằng regex đơn giản

  const tagRegex =
    /<(heading|paragraph|list)[^>]*>([\s\S]*?)<\/\1>/g;
  let match;

  while ((match = tagRegex.exec(xmlContent)) !== null) {
    const tagName = match[1];
    const content = match[2].trim();

    if (tagName === "heading") {
      const levelMatch = match[0].match(/level="(\d)"/);
      const level = levelMatch ? parseInt(levelMatch[1]) : 1;

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: content,
              bold: true,
              size: level === 1 ? 32 : 26,
              font: "Times New Roman",
            }),
          ],
          heading: level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
        })
      );
    } else if (tagName === "paragraph") {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: content,
              size: 24,
              font: "Times New Roman",
            }),
          ],
          spacing: { after: 100 },
        })
      );
    } else if (tagName === "list") {
      // Parse <item> bên trong
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let itemMatch;
      while ((itemMatch = itemRegex.exec(content)) !== null) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: itemMatch[1].trim(),
                size: 24,
                font: "Times New Roman",
              }),
            ],
            bullet: { level: 0 },
            spacing: { after: 60 },
          })
        );
      }
    }
  }

  const docx = new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(docx);
  fs.writeFileSync(OUTPUT_FILE, buffer);
  console.log(`Done! File saved: ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
