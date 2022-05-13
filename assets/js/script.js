var tasks = {};

var createTask = function(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  //check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function(list, arr) {
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-primary").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

//task text was clicked
$(".list-group").on("click", "p", function() {
  //get current text of p element
  var text = $(this)
    .text()
    .trim();

  //replace p element with a new textarea  
  var textInput = $("<textarea>").addClass("form-control").val(text);
  $(this).replaceWith(textInput);

  //auto focus new element "highlights"
  textInput.trigger("focus");
});

$(".list-group").on("blur", "textarea", function(){
  //get the textarea's current value/text
  var text =$(this).val().trim();
  
  //get the parent ul's id attribute
  var status = $(this)
  .closet(".list-group")
  .attr("id")
  .replace("list-","");
  //get the task's position in the list of other li elements
  var index =$(this)
  .closet(".list-group-item")
  .index();

  tasks[status][index].text = text;  //tasks, is an object, task[status] returns an array, tasks[status][index] returns the object at the given index in the array, tasks[status][index].text returns the text property of the object at the given index
  saveTasks();

  //recreate p element
  var taskP = $("<p>")
  .addClass("m-1")
  .text(text);

  //replace textarea with p element
  $(this).replaceWith(taskP);
});

//due date was clicked
$(".list-group").on("click", "span", function(){
  //get current text
  var date = $(this)
   .text()
   .trim();

  //create new inpute element
  var dateInput = $("<input>")
   .attr("type", "text")
   .addClass("form-control")
   .val(date);

   //swap out elements
  $(this).replaceWith(dateInput);

  //enable jquery ui datepicker
  dateInput.datepicker({  //should provide the calandar on the inputs that are already due
    minDate:1,
    onClose: function(){
      //when calender is closed, force a "change" event on the 'dateInput'
      $(this).trigger("change");
    }
  });

  //automatically focus on new element
  dateInput.trigger("focus");
});

$(".list-group").on("change", "input[type='text']", function() { //using change instead of blur can set the calandar
  //get current text
  var date = $(this).val();

  //get the parent ul's id attribute
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");

  //get the task's position in the list of other li elements
  var index = $(this).closest(".list-group-item").index();

  //update task in array and re-save to localstorage
   tasks[status][index].date = date;
  saveTasks();

  //recreate span element with bootstrap classes
  var taskSpan = $("<span>").addClass("badge badge-primary badge-pill").text(date);

  $(this).replaceWith(taskSpan); //helps set the list group to update their color depebnding on how close due date

  //pass task's <li> element into auditTask() to check new due date
  auditTask($(taskSpan).closet(".list-group-item"));
});

// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

//makes things moveable
$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function(event) {  //to do list
    console.log("activate", this); 
  },
  deactivate: function(event) {  //done list
    console.log("deactivate", this);
  },
  over: function(event) {  //to do list
    console.log("over", event.target);
  },
  out: function(event) {   //moving out
    console.log("out", event.target);
  },
  update: function(event) {  //to in progress

    //array to store the task data in
    var tempArr = [];

    //loop over current set of children in sortable list
    $(this).children().each(function(){
      var text = $(this)
      .find("p")
      .text()
      .trim();

      var date = $(this)
      .find("span")
      .text()
      .trim();

      //add task data to the temp array as an object
      tempArr.push({
        text: text,
        date: date
      });
    });

    // trim down list's ID to match object property  makes sure it is saved in its location
    var arrName = $(this)
    .attr("id")
    .replace("list-", "");

    // update array on tasks object and save
    tasks[arrName] = tempArr;
    saveTasks();
  }
});

//the delete drag and drop
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function(event, ui) {
    console.log("drop");
    ui.draggable.remove(); //remove the dragged item
  },
  over: function(event, ui){
    console.log("over");
  },
  out: function(event, ui){
    console.log("out");
  }
});

//gives the calander
$("#modalDueDate").datepicker({
  minDate: 1  //with the use of 1, we force the user to selece the days away from the present, cannot select the past
});  //datepicker is the thing that sets the date calander


//sets the highlight of the due date and how close it is to expire, color is coming from moment.js
var auditTask = function(taskEl){
  //get date from task element
  var date = $(taskEl).find("span").text().trim();


  //convert to moment object at 5:00pm
  var time = moment(date, "L").set("hour", 17); //we use 17 because of military time 24 hours, so should be 5pm
  //this should print out an object for the value of the date variable, but at 5:00pm of that date

  //remove any old classes from element
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  //apply new class if task is near/over the due date, with the use of moment.js but might not need to use for the hw, it could be the updated version
  if(moment().isAfter(time)){
    $(taskEl).addClass("list-group-item-danger");
  }
  else if (Math.abs(moment().diff(time, "days")) <=2){  
    $(taskEl).addClass("list-group-item-warning");
  }
};

//sets the automated timer but will run every moment that the timer has been set, loopes every 5 seconds to se if anything is due
setInterval(function () {
  $(".card .list-group-item").each(function(index, el) {
    auditTask(el);
  });
}, (1000 * 60) * 30);

// load tasks for the first time
loadTasks();

//sets the automated timer but will only run once
// setTimeout(function(){
//   alert("This message happens after 5 seconds!");
// },5000);
