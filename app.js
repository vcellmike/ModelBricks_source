const fs = require("fs");
const express = require("express");
const app = express();
const exphbs = require("express-handlebars");
const handlebars = require("handlebars");
const path = require("path");
const xml2js = require("xml2js");
const util = require("util");
const fetch = require("node-fetch");
const htmlparser2 = require("htmlparser2");
const PORT = process.env.PORT || 4002;

var indexRouter = require("./routes/index");

app.use(express.json());

// view engine setup
const hbs = exphbs.create({
  extname: "hbs",
  defaultLayout: "main",

  // create custom helper
  helpers: {
    trimString: function (passedString) {
      if (passedString.includes("::")) {
        var indexToSlice = passedString.indexOf("::") + 2;
        var length = passedString.length;
        var theString = passedString.slice(indexToSlice, length);
        return theString;
      } else {
        return passedString;
      }
    },
    trimVcid: function (passedString) {
      if (passedString.includes("(")) {
        var indexToSlice = passedString.indexOf("(") + 1;
        var length = passedString.length - 1;
        var theString = passedString.slice(indexToSlice, length);
        return theString;
      } else {
        return passedString;
      }
    },
    toDate: function (timeStamp) {
      var theDate = new Date(timeStamp);
      dateString = theDate.toGMTString();
      date = dateString.slice(5, 16);
      return dateString;
    },
    ifvalue: function (conditional, options) {
      if (options.hash.value === conditional) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    },
    nullCheck: function (inputString) {
      var string = inputString;
      if (string) {
        return string;
      } else {
        string = "Null";
        return string;
      }
    },
  },
});

app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");

//XML parser
// var parser = new xml2js.Parser();
// fs.readFile("Biomodel_172076998.xml", (err, data) => {
//   parser.parseString(data, (err, result) => {
//     // console.dir(util.inspect(result, false, null, true));
//     // console.log("Read finished!");
//     let data = JSON.stringify(result);
//     fs.writeFileSync("/public/js/new.json", data);
//     console.log("file written");
//   });
// });

app.get("/data", (req, res) => {
  var parser = new xml2js.Parser();
  fs.readFile("./biomodels/Biomodel_176196222.vcml", (err, data) => {
    parser.parseString(data, (err, result) => {
      const data = result;
      res.render("data", {
        title: "ModelBricks - JSON DATA",
        data,
      });
    });
  });
});

app.get("/json", (req, res) => {
  var parser = new xml2js.Parser();
  fs.readFile("./biomodels/Biomodel_172076998.vcml", (err, data) => {
    parser.parseString(data, (err, result) => {
      res.send(result);
    });
  });
});
app.get("/ajson", (req, res) => {
  var parser = new xml2js.Parser();
  fs.readFile(
    "./annotations/CM_PM18628746_MB1__Rab5_switch_annotations.xml",
    (err, data) => {
      parser.parseString(data, (err, result) => {
        res.send(result);
      });
    }
  );
});

// single model page
app.get("/curatedList/model", (req, res) => {
  var parser = new xml2js.Parser();
  fs.readFile("Biomodel_147699816.xml", (err, data) => {
    parser.parseString(data, (err, result) => {
      const data = result;
      res.render("model", {
        title: "ModelBricks - Model Page",
        data,
      });
    });
  });
});

// Fetching Curated List of models from API
app.get("/listData", async (req, res) => {
  // const api_url =
  //   "https://vcellapi-beta.cam.uchc.edu:8080/biomodel?bmName=&bmId=&category=all&owner=ModelBrick&savedLow=&savedHigh=&startRow=1&maxRows=10&orderBy=date_desc";
  const api_url =
    "https://vcellapi-beta.cam.uchc.edu:8080/publication?submitLow=&submitHigh=&startRow=1&maxRows=10&hasData=all&waiting=on&queued=on&dispatched=on&running=on";
  const fetch_response = await fetch(api_url);
  const json = await fetch_response.json();
  res.json(json);
});

app.get("/curatedList", async (req, res) => {
  const api_url =
    "https://vcellapi-beta.cam.uchc.edu:8080/biomodel?bmName=&bmId=&category=all&owner=ModelBrick&savedLow=&savedHigh=&startRow=1&maxRows=10&orderBy=date_desc";

  const fetch_response = await fetch(api_url);
  const json = await fetch_response.json();
  res.render("curatedList", {
    title: "ModelBricks - Curated List",
    json,
  });
});
app.get("/curatedList/search", async (req, res) => {
  var bmName = req.query.bmName;

  const api_url =
    "https://vcellapi-beta.cam.uchc.edu:8080/biomodel?bmName=" +
    bmName +
    "&bmId=&category=all&owner=ModelBrick&savedLow=&savedHigh=&startRow=1&maxRows=10&orderBy=date_desc";

  const fetch_response = await fetch(api_url);
  const json = await fetch_response.json();
  res.render("curatedList", {
    title: "ModelBricks - Curated List",
    json,
    bmName,
  });
});

app.get("/curatedList/model/:id", (req, res) => {
  // var info = "null";
  var parser = new xml2js.Parser();
  fs.readFile(
    "./biomodels/Biomodel_" + req.params.id + ".vcml",
    (err, data) => {
      parser.parseString(data, (err, result) => {
        data = result;
        res.render("model", {
          title: "ModelBricks - Model Page",
          data,
        });
      });
    }
  );
  var parser = new xml2js.Parser();
  fs.readFile(
    "./annotations/CM_PM18628746_MB1__Rab5_switch_annotations.xml",
    (err, data) => {
      parser.parseString(data, (err, result) => {
        info = result;
        let jsonData = JSON.stringify(info);
        fs.writeFileSync("./public/json/" + "annotations" + ".json", jsonData);
      });
    }
  );
});

app.get("/curatedList/printModel/:id", (req, res) => {
  var parser = new xml2js.Parser();
  fs.readFile(
    "./biomodels/Biomodel_" + req.params.id + ".vcml",
    (err, data) => {
      parser.parseString(data, (err, result) => {
        const data = result;
        // generating static html pages in ./public/html
        var template = handlebars.compile(
          fs.readFileSync("./temp/modelTemplate.html", "utf8")
        );
        var generated = template({ data: data });
        fs.writeFileSync(
          "./public/html/" + "model_" + req.params.id + ".html",
          generated,
          "utf-8"
        );

        let annotations = [];
        // html parser
        // Traversing Annotaions
        // data.vcml.BioModel[0].vcmetadata[0].nonrdfAnnotationList[0].nonrdfAnnotation.forEach(
        //   function (item) {
        //     const parser = new htmlparser2.Parser(
        //       {
        //         onopentag(name, attribs) {
        //           if (name === "script" && attribs.type === "text/javascript") {
        //             console.log("JS! Hooray!");
        //           }
        //         },
        //         ontext(text) {
        //           if (text.length > 10) {
        //             console.log(text);
        //             text.trim();
        //             text.replace(/\r?\n|\r/g, "");
        //             annotations.push({ vcid: item.$.vcid, annotation: text });
        //             // console.log(annotations);

        //             let jsonData = JSON.stringify(annotations);
        //             fs.writeFileSync(
        //               "./public/json/" + "model" + ".json",
        //               jsonData
        //             );
        //           }
        //         },
        //         onclosetag(tagname) {
        //           if (tagname === "html") {
        //             console.log("Done");
        //           }
        //         },
        //       },
        //       { decodeEntities: true }
        //     );

        //     parser.write(item.freetext);
        //     parser.end();
        //   }
        // );

        res.render("printModel", {
          title: "ModelBricks - Model Print Page",
          data,
        });
      });
    }
  );
});

//static pages
app.use(express.static(path.join(__dirname, "public")));

// Routing
app.use("/", indexRouter);

// Server Port
app.listen(PORT, (err) => {
  if (err) {
    return console.log("ERROR", err);
  }
  console.log(`Listening on port ${PORT}...`);
});

module.exports = app;
