import { useEffect, useState } from "react";
import { Tooltip, Modal, Input, List, Avatar, Button } from "antd";
import { w3cwebsocket as W3CWebSocket } from "websocket";
import { Container, Row, Col } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion"
import axios from 'axios'
import moment from 'moment'
import isLength from 'validator/lib/isLength'

import "./App.css";

const IP = '45.80.181.154:5000'

const formUser = { user: { value: "", isValid: true, message: null } }

const validateUsername = (state, setState) => {
  const user = { ...state.user };
  let isGood = true;

  if(!isLength(user.value, {min: 1, max: 100})){
    user.isValid = false;
    user.message = "Username must be between 1 and 100 characters";
    isGood = false;
  }

  if (!isGood) setState({ ...state, user });
  return isGood;
}

const App = () => {
  const [visible, setVisible] = useState(false);
  const [username, setUsername] = useState(formUser);
  const [message, setMessage] = useState([]);
  const [activeUser, setActiveUser] = useState([]);
  const [sendMessage, setSendMessage] = useState("");
  const [client, setClient] = useState();

  const { user } = username;

  useEffect(() => {
    axios.get(`http://${IP}/history`)
      .then(res => {
        const data = []
        res.data.map(msg => (
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

  const onSubmitModal = () => {
    if (validateUsername(username, setUsername)) {
      setVisible(false);
      const data = new W3CWebSocket(
        `ws://${IP}/ws?username=${user.value}`
      );
      setClient(data);

      data.onopen = () => {
        data.send(`https://ui-avatars.com/api/?name=${user.value}`);
      };

      setUsername(formUser)

      data.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if(data.message){
          const newMsg = {
            id: data.id,
            message: data.message,
            username: data.username,
            avatar: data.avatar,
            received: data.received,
          }
          setMessage((oldMessage) => [ newMsg, ...oldMessage ]);
        } 
        if(data.users){
          setActiveUser(data.users)
        }
      };
    }
  };

  const onSendMessage = () => {
    if(sendMessage.replace(/\n/g, "").length > 0) {
      if(client) client.send(sendMessage);
    }
    setSendMessage("");
  };

  useEffect(() => { setVisible(true); }, []);

  const inputChangeHandler = e => {
    const value = e.target.value;
    const name = e.target.name;

    const data = {
      ...username,
      [name] : { ...username[name], value: value, isValid: true, message: null }
    }
    setUsername(data)
  }

  let newSortMessage = message
  newSortMessage.sort((a, b) => b.id - a.id)

  return (
    <>
      <Modal
        centered
        zIndex={3000}
        title="Welcome Back Mentimuners"
        visible={visible}
        footer={[ <Button key="submit" type="primary" block onClick={onSubmitModal}> Join </Button> ]}
      >
        <Input name="user" value={user.value} placeholder="Username" onChange={inputChangeHandler} onPressEnter={onSubmitModal} />
        {!user.isValid && ( <small class="form-text text-muted">{user.message}</small>)}
      </Modal>

        {!visible && (
          <>
            <nav className="navbar sticky-top navbar-light bg-white shadow-sm">
              <h3 className="mx-auto my-3">PRIVACY BY DEFAULT 😎</h3>
            </nav>
            <section className="bg-white">
              <Container fluid>
                <Row>
                  <Col lg={6} md={6}>
                    <div className="position-sticky" style={{ top: "calc(81px + 30px)", marginTop: 30 }} >
                      <Input.TextArea
                        className="input-message"
                        autoSize={{ minRows: 10, maxRows: 10 }}
                        placeholder="Press enter to send the message"
                        value={sendMessage}
                        onPressEnter={onSendMessage}
                        onChange={(e) => setSendMessage(e.target.value)}
                      />
                      <Button type="primary" block className="mt-3" onClick={onSendMessage}> Send </Button>
                    </div>
                  </Col>
                  <Col lg={6} md={6}>
                    <div className="mb-2 border-bottom position-sticky bg-white" style={{ top: "calc(81px)", zIndex: 1010 }} >
                      <p className="mb-1" style={{ paddingTop: "31px" }}> Active Users </p>
                      <AnimatePresence>
                        {activeUser.map((user, i) => (
                          <motion.span key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ".3" }}>
                            <Tooltip title={user.username}>
                              <Avatar size={40} className="mb-2 mr-1" src={user.avatar} />
                            </Tooltip>
                          </motion.span>
                        ))}
                      </AnimatePresence>
                    </div>
                    <div className="history-chat-height">
                      <List itemLayout="horizontal">
                        <AnimatePresence initial={false}>
                          {newSortMessage.map(msg => (
                            <motion.li
                              className="ant-list-item"
                              key={msg.id}   
                              style={{ x: -100 }} animate={{ x: 0 }}
                            >
                              <List.Item.Meta
                                avatar={<Avatar size={45} src={msg.avatar} />}
                                title={<>{msg.username} <small>{moment(msg.received).fromNow()}</small></>}
                                description={msg.message}
                              />
                            </motion.li>
                          ))}
                        </AnimatePresence>
                      </List>
                    </div>
                  </Col>
                </Row>
              </Container>
            </section>
          </>
        )}
    </>
  );
};

export default App;
