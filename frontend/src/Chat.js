import { useState, useEffect } from "react";
import { Input, Button, Row, Col, Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { w3cwebsocket as W3CWebSocket } from "websocket";
import { motion, AnimatePresence } from "framer-motion"

import axios from "axios";
import moment from "moment";
import RowB from "react-bootstrap/Row";
import ColB from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Media from "react-bootstrap/Media";
import Navbar from "react-bootstrap/Navbar";
import Container from "react-bootstrap/Container";
import isEmpty from "validator/lib/isEmpty";
import AutoScroll from "@brianmcallister/react-auto-scroll";

import validateJoinUser from "./validateJoinUser";

import "./Chat.css";

const formUsername = {
  username: { value: "", isValid: true, message: null },
};

const IP = '45.80.181.154:5000'

const Chat = () => {
  const [client, setClient] = useState();
  const [message, setMessage] = useState([]);
  const [newJoin, setNewJoin] = useState(true);
  const [user, setUser] = useState(formUsername);
  const [activeUser, setActiveUser] = useState([]);
  const [textMessage, setTextMessage] = useState("");
  const [height, setHeight] = useState(0);

  const { username } = user;

  const inputUsernameChangeHandler = (e) => {
    const value = e.target.value;
    const name = e.target.name;
    const data = {
      ...user,
      [name]: { ...username[name], value: value, isValid: true, message: null },
    };
    setUser(data);
  };

  useEffect(() => {
    axios.get(`http://${IP}/history`)
      .then(res => {
        const data = []
        res.data.reverse().map(msg => (
          data.push({
            id: msg.id,
            message: msg.message,
            username: msg.username,
            avatar: msg.avatar,
            received: msg.received,
          })
        ))
        setMessage(data)
      })
      .catch(() => { })
  }, [activeUser.length])

  const onJoinHandler = () => {
    if(validateJoinUser(user, setUser)){
      const data = new W3CWebSocket(
        `ws://${IP}/ws?username=${username.value}`
      );
      setClient(data);

      data.onopen = () => {
        data.send(`https://ui-avatars.com/api/?name=${username.value}`);
        setUser(formUsername); setNewJoin(false);
      };

      data.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if(data.message){
          const newMsg = { id: data.id, message: data.message, username: data.username, avatar: data.avatar, received: data.received }
          setMessage((oldMessage) => [ ...oldMessage, newMsg ]);
        } 
        if(data.users){
          setActiveUser(data.users)
        }
      }
    }
  }

  const onSendMessage = () => {
    if(!isEmpty(textMessage)){
      if(client) client.send(textMessage); setTextMessage("")
    }
  }

  useEffect(() => {
    if(!newJoin){
      const height = document.getElementById('history-message').clientHeight;
      setHeight(height)
    }
  }, [newJoin])

  return (
    <>
      {newJoin ? (
        <Container className="vh-100">
          <section className="text-center h-100">
            <RowB className="align-items-center justify-content-center h-100">
              <ColB lg={5} md={8} sm={10}>
                <h2 className="mb-4">Welcome Back Mentimuners</h2>
                <Input
                  size="large"
                  placeholder="Username"
                  name="username"
                  prefix={<UserOutlined />}
                  value={username.value}
                  onPressEnter={onJoinHandler}
                  onChange={inputUsernameChangeHandler}
                />
                {!username.isValid && ( <small class="form-text text-left text-danger">{username.message}</small>)}

                <Button type="primary" className="mt-2" block onClick={onJoinHandler}>
                  Join
                </Button>
              </ColB>
            </RowB>
          </section>
        </Container>
        ) : (
        <section className="vh-100">
          <Navbar bg="light">
            <Navbar.Brand href="/"><h4>Mentimuners ❤️  Privacy 🤟🏼</h4></Navbar.Brand>
          </Navbar>
          <Row>
            <Col md={6} lg={6} className="sidebar">
              <p className="sidebar-title">Online users - {activeUser.length}</p>

              <div className="scrollable-online-user">
                {activeUser.map((user, i) => (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ".3" }} className="sidebar-online-user text-truncate" key={i}>
                    <Avatar size={40} src={user.avatar} /> 
                    <span className="sidebar-online-username user-select-none text-truncate">{user.username}</span>
                  </motion.div>
                ))}
              </div>
            </Col>
            <Col md={24-6} lg={24-6} className="chat-wrapper">
              <div id="history-message" className="scrollable-history-message">
                <AutoScroll 
                  height={height}
                  scrollBehavior="none"
                  showOption={false}
                >
                  <AnimatePresence initial={false}>
                    {message.map(msg => (
                      <motion.div
                        key={msg.id}
                        className="media"
                        style={{ x: -100 }} animate={{ x: 0 }}
                      >
                        <Avatar size={45} src={msg.avatar} /> 
                        <Media.Body className="ml-3">
                          <h4 className="ant-list-item-meta-title text-black">
                            {msg.username}
                            <small className="text-secondary ml-1">{moment(msg.received).fromNow()}</small>
                          </h4>
                          <p className="ant-list-item-meta-description message-body text-dark">
                            {msg.message}
                          </p>
                        </Media.Body>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </AutoScroll>
              </div>
              
              <Card className="border-0">
                <Card.Body className="d-flex">
                  <Input 
                    size="large" 
                    placeholder="Press enter to send message" 
                    value={textMessage}
                    onPressEnter={onSendMessage}
                    onChange={e => setTextMessage(e.target.value)}
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </section>
      )}
    </>
  );
};

export default Chat;
