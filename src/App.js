import React, {useState, useEffect, useRef} from "react";
import io from "socket.io-client";
import './App.css';


const App = () => {
  const [yourID, setYourID] = useState();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [accept, setAccept] = useState("");
  const [deny, setDeny] = useState("");
  const [roomRequestUser, setRoomRequestUser] = useState("");
  const [showButtonsBoolean, setShowButtonsBoolean] = useState(true);
  const [show_Hide, setShow_Hide] = useState("Show connected users and hide chat");
  const [messageButtonFunction, setMessageButtonFunction] = useState(() => () => sendMessageGlobal());
  const [room, setRoom] = useState("");

  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io.connect('/api/*');

    var your_id = "x";
    var users_connected = ([]);
    var are_you_in_room = (false);
    var room_string = ("");

    socketRef.current.on("your_id", id => {
      setYourID(id);
      socketRef.current.emit("request_users", id);
      your_id = id;
    })

    socketRef.current.on("set are_you_in_room to false", socket => {
      are_you_in_room = (false);
    })

    socketRef.current.on("message", (messageObject) => {
      if (are_you_in_room === false) {
        const today = new Date();
        const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        const dateTime = date+' '+time;
        const primalMessage = (" said: " + messageObject.body);
        if (!(your_id === messageObject.id)) {
          const finalMessage = (dateTime + " || '" + messageObject.id + "'" + primalMessage)
          setMessages(oldMsgs => [finalMessage, ...oldMsgs]);
        } else {
          const finalMessage = (dateTime + " || You said: " + messageObject.body);
          setMessages(oldMsgs => [finalMessage, ...oldMsgs]);
        }
      }
      
    })

    socketRef.current.on("new_user", id => {
      newUser(id);
      users_connected.push(id);
    })

    socketRef.current.on("another_user_room_request", a => {
      var e = document.getElementById("accept_button").style
      var f = document.getElementById("deny_button").style
      var d = document.getElementById("room_request_paragraph").style
      alert(a + " requested to create a room with you.");
      setRoomRequestUser(a);
      createRoomRequestButtons();
      e.display = "block";
      f.display = "block";
      d.display = "block";
    })

    socketRef.current.on("request_users_to_oldusers", userObject => {
      const finalID_package = {
        oldUser: userObject.sender,
        joinedUser: your_id,
      };
      socketRef.current.emit("final_emit_to_server", finalID_package);
    })

    socketRef.current.on("final_emit", x => {
      newUser(x);
      users_connected.push(x);
    })

    socketRef.current.on("room_joined_message + room_joined_logic", x => {
      if (x.userWhoRequested === your_id) {
        alert("You and: '" + x.userWhoAccepted + "' are now placed together in room '" + x.userWhoRequested + "'.");
        document.getElementById("chat_paragraph").innerHTML = ("Room  " + your_id + " chat")
      } else {
        alert("You and: '" + x.userWhoRequested + "' are now placed together in room '" + x.userWhoRequested + "'.");
      }
      room_string = (x.userWhoRequested);
      are_you_in_room = (true);
      setRoom(x.userWhoRequested);
      setMessageButtonFunction(() => () => sendMessageInRoom())
      setMessages([]);
      const leave_room_button = document.getElementById("leave_room_button").style;
      const show_users_buttons = document.getElementById("show_chat_users_button").style
      const users_buttons = document.getElementById("user_buttons").style;
      const chat_box = document.getElementById("bodybox").style;
      const current_room_paragraph = document.getElementById("current_room_paragraph").style
      leave_room_button.visibility = "visible";
      show_users_buttons.visibility = "hidden";
      chat_box.display = "block";
      users_buttons.display = "none";
      current_room_paragraph.display = "block";
    })

    socketRef.current.on("remove_user_from_list", disconnectedUser => {
      const arrayLength = users_connected.length;
      for (var i = 0; i < arrayLength; i++) {
        if (users_connected[i] === disconnectedUser) {
          users_connected.splice(i, 1);
          setUsers([]);
          setUsers(users_connected);
        }
      }
    })

    socketRef.current.on("room message finalized", messageObject => {
      debugger;
      const today = new Date();
      const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
      const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      const dateTime = date+' '+time;
      const primalMessage = (" said: " + messageObject.body);
      if (!(your_id === messageObject.id)) {
        const finalMessage = (dateTime + " || '" + messageObject.id + primalMessage)
        setMessages(oldMsgs => [finalMessage, ...oldMsgs]);
      } else {
        const finalMessage = (dateTime + " || You" + primalMessage);
        setMessages(oldMsgs => [finalMessage, ...oldMsgs]);
      }
    })

    socketRef.current.on("room request denied message", userWhoDenied => {
      alert("Room request to: " + userWhoDenied + " was denied.")
    })

    socketRef.current.on("users are in a room", roomSockets => {
      users_connected = users_connected.filter(oldUsers_connected => oldUsers_connected !== roomSockets.userWhoRequested);
      users_connected = users_connected.filter(oldUsers_connected => oldUsers_connected !== roomSockets.userWhoAccepted);
      setUsers([]);
      setUsers(users_connected);
    })

    socketRef.current.on("other user left room", leaverID => {
      if (!(room_string === (""))) {
        alert("User '" + leaverID + "' left the room.");
      }
    })

    socketRef.current.on("leave room 1", leaveRoomObject => {
      room_string = ("");
      socketRef.current.emit("leave room 2", leaveRoomObject);
    })

  }, []);

  function sendMessageInRoom() {
    const roomUnfinished = document.getElementById("current_room_paragraph");
    const roomUnfinished2 = roomUnfinished.textContent;
    const room = roomUnfinished2.slice(27);
    const message = document.getElementById("chatbox").value;
    const idUnfinished = document.getElementById("h2");
    const idUnfinished2 = idUnfinished.textContent;
    const id = idUnfinished2.slice(12);
    const messageObject = {
      body: message,
      id: id,
      room: room,
    };
    setMessage("");
    socketRef.current.emit("room message", messageObject);
  }

  function createRoomRequestButtons() {
    setAccept("Accept room request");
    setDeny("Deny room request");
  }

  function newUser(user) {
    setUsers(oldUsers => [...oldUsers, user]);
  }

  function handleChange(e) {
    setMessage(e.target.value);
  }

  function sendMessageGlobal() {
    const x = document.getElementById("chatbox").value;
    const node = document.getElementById("h2");
    const textContent = node.textContent;
    const slicedTextContent = textContent.slice(12);
    const messageObject = {
      body: x,
      id: slicedTextContent,
    };
    setMessage("");
    socketRef.current.emit("send message", messageObject);
  }

  function start_room_with_user(senderID, user_requested) {
    const roomObject = {
      sender: senderID,
      user_requested: user_requested,
    };
    socketRef.current.emit("room_request", roomObject);
  }
  
  function denyRoomRequest() {
    var e = document.getElementById("accept_button").style
    var f = document.getElementById("deny_button").style
    var d = document.getElementById("room_request_paragraph").style
    setAccept("");
    setDeny("");
    setRoomRequestUser("");
    e.display = "none";
    f.display = "none";
    d.display = "none";
    const roomRequestDeniedObject = {
      requestUser: roomRequestUser,
      denyUser: yourID,
    }
    socketRef.current.emit("room request denied", roomRequestDeniedObject);
  }

  function acceptRoomRequest(userWhoRequestedRoom) {
    const accept_button = document.getElementById("accept_button").style
    const deny_button = document.getElementById("deny_button").style
    const room_request_paragraph = document.getElementById("room_request_paragraph").style
    const roomRequestObject = {
      userWhoRequested: userWhoRequestedRoom,
      userWhoAccepted: yourID,
    }
    socketRef.current.emit("room_request_accepted", roomRequestObject);
    setAccept("");
    setDeny("");
    setRoomRequestUser("");
    accept_button.display = "none";
    deny_button.display = "none";
    room_request_paragraph.display = "none";
    setMessageButtonFunction(() => () => sendMessageInRoom);
    setMessages([]);
    document.getElementById("chat_paragraph").innerHTML = ("Room " + userWhoRequestedRoom + " chat")
    
  }

  function hideConnectedUserButtons() {
    const e = document.getElementById("user_buttons").style;
    const f = document.getElementById("bodybox").style;
    if (showButtonsBoolean === true) {
      e.display = "block";
      f.display = "none";
      setShowButtonsBoolean(false);
      setShow_Hide("Show chat and hide connected users");
    } else {
      f.display = "block"
      e.display = "none";
      setShowButtonsBoolean(true);
      setShow_Hide("Show connected users and hide chat");
    };

  }

  function leaveRoom() {
    const leaveRoomObject = {
      room: room,
      leaverID: yourID,
    }
    socketRef.current.emit("leave room", leaveRoomObject);
    setRoom("");
    const show_chat_users_button = document.getElementById("show_chat_users_button").style;
    show_chat_users_button.visibility = "visible";
    const current_room_paragraph = document.getElementById("current_room_paragraph").style;
    current_room_paragraph.display = "none";
    const leave_room_button = document.getElementById("leave_room_button").style;
    leave_room_button.visibility = "hidden";
    setMessages([]);
    setMessageButtonFunction(() => () => sendMessageGlobal());
    setShow_Hide("Show connected users and hide chat");
    setShowButtonsBoolean(true);
    document.getElementById("chat_paragraph").innerHTML = ("Global chat");
  }

  return (
    <div>
      <h1>Duran Chat App</h1>
      <h2 id="h2" >Your id is: {yourID}</h2>
      <h3 style={{display: 'none'}} id="current_room_paragraph" >You are connected to room: {room}</h3>
      <div id="outer">
        <button id="send_message_button" onClick={() => {messageButtonFunction()}}>Send Message</button>
        <button id="show_chat_users_button" onClick={() => { hideConnectedUserButtons()} }>{show_Hide}</button>
        <button style={{visibility: 'hidden'}} id="leave_room_button" onClick={() => { leaveRoom() }}>Leave room/Join global chat</button>
      </div>
      <div id="outer">
        <p style={{display: 'none'}} id="room_request_paragraph" >Use buttons to take action to the room request from user: '{roomRequestUser}'</p>
        <button style={{display: 'none'}} id="accept_button" onClick={() => { acceptRoomRequest(roomRequestUser) }}>{accept}</button>
        <button style={{display: 'none'}} id="deny_button" onClick={() => { denyRoomRequest() }}>{deny}</button>
      </div>
      <div id='bodybox'>
        <div id='chatborder'>
          <h2 id="chat_paragraph">Global chat</h2>
          <input value={message} onChange={handleChange} type="text" name="chat" id="chatbox" placeholder="Type here to send message." onfocus="placeHolder()"></input>
            <div>
            {messages.map((message, index) => {
              return (
                <div key={index}>
                  <p>{message}</p>
                </div>
              )
          })}
        </div>
      </div>
      </div>
      <p style={{display: 'none'}} id="user_buttons">
        <p> Press to send a roomrequest to user: </p>
      {users.map((user, index) => {
          if (user.id === yourID) {
            return (null);
          } 
          return (
            <div key={index}>
              <button 
              onClick={() => { start_room_with_user(yourID, user) }}
              >{user}</button>
            </div>
          )
        })}
      </p>
    </div>
  )

};

export default App;