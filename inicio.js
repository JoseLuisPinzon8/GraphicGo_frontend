i=0
contextos = [0]
json = []
nodes = []
document.getElementById('version').innerHTML = _.VERSION;
window._ = _;

var editor = ace.edit("code");
editor.getSession().setTabSize(2);
editor.getSession().setMode("ace/mode/python");
editor.getSession().setValue(`def a()->str:
  for y in [1,2,3,4]:
    print(y)
    if(y > 2):
        return "funciona"
  return "no funciona"

print(a())`)

var input = ace.edit("input");
input.getSession().setTabSize(2);
input.getSession().setMode("ace/mode/text");

document.getElementById('execute').addEventListener('click', function() {
    var codigo = editor.getSession().getValue()
    var blob = new Blob([codigo], { type: 'text/plain' });
    var file = new File([blob], "myfile.txt", {type: "text/plain"});
    
    var input_text = input.getSession().getValue()
    var blob = new Blob([input_text], { type: 'text/plain' });
    var input_file = new File([blob], "input.txt", {type: "text/plain"});
    
    var formData = new FormData();
    
    formData.append("myfile", file);
    formData.append("input", input_file);

    axios.post('http://localhost:4567/analize', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    }).then(function (res) {
        json = res.data
        order = load_visualization(json)
        nodes = get_nodes(json,order)
        i = 0
        contextos = [0]
        $('#next').prop('disabled', false);
        $('#back').prop('disabled', true);
        $('#actual').html(" "+i+" ")
        $('#total').html(" "+nodes.length-1+" ")
        $('#output').html("")
        myDiagram.model.nodeDataArray = []
        myDiagram.model.linkDataArray = []
        new_visualization(nodes,1,i,"next")

    })
    .catch(function (e) {
        //console.log(e);
    });
    //document.getElementById('result').innerHTML = result;
});

var $$ = go.GraphObject.make;  // for conciseness in defining templates

myDiagram =
$$(go.Diagram, "myDiagramDiv",{allowMove:true,layout: $$(go.GridLayout)},
    );
    myDiagram.layout.wrappingColumn=1;
    myDiagram.animationManager.isEnabled = false;
// This template is a Panel that is used to represent each item in a Panel.itemArray.
// The Panel is data bound to the item object.
var fieldTemplate =
$$(go.Panel, "TableRow",  // this Panel is a row in the containing Table
    new go.Binding("portId", "name"),  // this Panel is a "port"
    {
    background: "transparent",  // so this port's background can be picked by the mouse
    fromSpot: go.Spot.Right,  // links only go from the right side to the left side
    toSpot: go.Spot.Left,

    },
    $$(go.TextBlock,
    {
        margin: new go.Margin(0, 5), column: 1, font: "bold 13px sans-serif",
        alignment: go.Spot.Left,
        // and disallow drawing links from or to this text:
        fromLinkable: false, toLinkable: false
    },
    new go.Binding("text", "name")),
    $$(go.TextBlock,
    { margin: new go.Margin(0, 5), column: 2, font: "13px sans-serif", alignment: go.Spot.Left },
    new go.Binding("text", "info"))
);

// This template represents a whole "record".
myDiagram.nodeTemplate =
$$(go.Node, "Auto",
    { copyable: false, deletable: false },
    //new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
    // this rectangular shape surrounds the content of the node
    $$(go.Shape,
    { fill: "#EEEEEE" }),
    // the content consists of a header and a list of items
    $$(go.Panel, "Vertical",
    // this is the header for the whole node
    $$(go.Panel, "Auto",
        { stretch: go.GraphObject.Horizontal },  // as wide as the whole node
        $$(go.Shape,
        { fill: "#1570A6", stroke: null }),
        $$(go.TextBlock,
        {
            alignment: go.Spot.Left,
            margin: 3,
            stroke: "white",
            textAlign: "center",
            font: "bold 12pt sans-serif"
        },
        new go.Binding("text", "key"))),
    // this Panel holds a Panel for each item object in the itemArray;
    // each item Panel is defined by the itemTemplate to be a TableRow in this Table
    $$(go.Panel, "Table",
        {
        padding: 2,
        minSize: new go.Size(100, 10),
        defaultStretch: go.GraphObject.Horizontal,
        itemTemplate: fieldTemplate
        },
        new go.Binding("itemArray", "fields")
    )  // end Table Panel of items
    )  // end Vertical Panel
);  // end Node



myDiagram.model =
$$(go.GraphLinksModel,
    {
    copiesArrays: true,
    copiesArrayObjects: true,
    linkFromPortIdProperty: "fromPort",
    linkToPortIdProperty: "toPort",
    nodeDataArray: [
        /*{
        key: "Record1",
        fields: [
            { name: "field1", info: ""},
            { name: "field2", info: "the second one" },
            { name: "fieldThree", info: "3rd" }
        ],
        loc: "0 0"
        },
        {
        key: "Record2",
        fields: [
            { name: "fieldA", info: "" },
            { name: "fieldB", info: "" },
            { name: "fieldC", info: "" },
            { name: "fieldD", info: "fourth" }
        ],
        loc: "280 0"
        },
        {
        key: "Record3",
        fields: [
            { name: "field1", info: "" },
            { name: "field2", info: "the second one" },
            { name: "fieldThree", info: "3rd" }
        ],
        loc: "0 150"
        },
        {
        key: "Record4",
        fields: [
            { name: "fieldA", info: "" },
            { name: "fieldB", info: "" },
            { name: "fieldC", info: "" },
            { name: "fieldD", info: "fourth" }
        ],
        loc: "280 150"
        }  */
    ],
    linkDataArray: [
        /*{ from: "Record1", fromPort: "field1", to: "Record2", toPort: "fieldA" },
        { from: "Record1", fromPort: "field2", to: "Record2", toPort: "fieldD" },
        { from: "Record1", fromPort: "fieldThree", to: "Record4", toPort: "fieldB" } 
    */]
    });
    function get_nodes(json,order){
        nodes = []
        nodes_array = []
        for (let i = 0; i < order.length; i++) {
          vision = json[order[i][0]]
          callStack = vision['callStack']
          symbolTable = vision['symbolTable']
          node = {
            key: "",
            fields: [
                //{ name: "field1", info: ""},
            ],
            loc: ""
          }
          node.key = symbolTable["."].value
          field_keys = Object.keys(symbolTable)
          for (let k = 0; k < field_keys.length; k++) {
            if(field_keys[k]=='.')
              continue
            if (symbolTable[field_keys[k]].value){
              if (symbolTable[field_keys[k]].type=="list"){
                node.fields.push({name:field_keys[k],info:list_to_string(symbolTable[field_keys[k]].value)})
              }
              else
                node.fields.push({name:field_keys[k],info:symbolTable[field_keys[k]].value})
            }
              
            else
              node.fields.push({name:field_keys[k],info:symbolTable[field_keys[k]].type})
          }
          nodes.push(node)
        }
        return nodes  
      }

      function list_to_string(list){
        if (list =='None')
          return 'None'
        values = {}
        for (let i = 0; i < list.length; i++) {
          values[i] = list[i].value          
        }
        return Object.values(values)
      }

      function next(){
        i = i+1
        new_visualization(nodes,1,i,"next")
        
      }
      function back(){
        i = i-1
        new_visualization(nodes,1,i,"back")
      }
  
  
      function new_visualization(nodes,links,i,direction){
        editor.gotoLine(json[i].lineNumber);
        if(direction=="next"){
          if(!change_context(json,i)){
            contextos[contextos.length-1] = i
          }
          else{
            dif=diff(json,i)
            if (dif == 1){
              contextos.push(i)
            }
            else if(dif==-1){
              a = contextos.pop()
            }
              
          }
        }
        else{
          
          if(!change_context(json,i+1)){
            contextos[contextos.length-1] = i
          }
          else{
            dif=diff(json,i+1)
            if (dif == -1){
              contextos.push(i)
            }
            else if(dif==1){
              a = contextos.pop()
            }
              
          }
        }

        tmp = []
          for (let k = 0; k < contextos.length; k++) {
            tmp.push(nodes[contextos[k]])          
          }
          
          myDiagram.model.nodeDataArray = []
          myDiagram.model.linkDataArray = []
          myDiagram.commit(function(d) {
              d.model.addNodeDataCollection(tmp)
              //d.model.addLinkDataCollection(links)
          })
          if (i+1==nodes.length)
            $('#next').prop('disabled', true);
          else
            $('#next').prop('disabled', false);
          if (i-1<=0)
            $('#back').prop('disabled', true);
          else
            $('#back').prop('disabled', false);
          $('#actual').html(" "+i+" ")
          $('#total').html(" "+nodes.length-1+" ")
          string = ""
          for (let k = 0; k < json[i]['outputs'].length; k++) {
            string= string+ json[i]['outputs'][k]+'\n'
            
          }
          $('#output').html(string)
          
      }
      function load_visualization(json){
        order = []
        for (let i = 0; i < json.length; i++) {
          order.push([i,json[i]['lineNumber']])
        }
        return order
    }
    function diff(json,position){
      return (json[position]['callStack'].length - json[position-1]['callStack'].length )
    }
    function change_context(json,position){
        return (json[position]['callStack'].length !=json[position-1]['callStack'].length )
    }
    function find_next(json,context,position){
        next_position = -1
        for (let i = position+1; i < json.length; i++) {
          if (json[i]['callStack'].length==context){
            next_position=i
            break
          }          
        }
        return next_position
    }