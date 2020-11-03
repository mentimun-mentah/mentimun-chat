import { useEffect, useState } from "react";
import { Tooltip, Modal, Input, List, Avatar, Button } from "antd";
import { w3cwebsocket as W3CWebSocket } from "websocket";
import { Container, Row, Col } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion"
import moment from 'moment'

import "./App.css";

const App = () => {
  const [visible, setVisible] = useState(false);
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState([]);
  const [activeUser, setActiveUser] = useState([]);
  const [sendMessage, setSendMessage] = useState("");
  const [client, setClient] = useState();


  const onSubmitModal = () => {
    if (username) {
      setVisible(false);
      const data = new W3CWebSocket(
        `ws://45.80.181.154:5000/ws?username=${username}`
      );
      setClient(data);

      data.onopen = () => {
        data.send(`https://ui-avatars.com/api/?name=${username}`);
      };

      data.onmessage = (message) => {
        const data = JSON.parse(message.data);
        if(data.message){
          setMessage((oldMessage) => [
            ...oldMessage,
            {
              message: data.message,
              username: data.username,
              avatar: data.avatar,
              received: data.received,
            },
          ]);
        } 
        if(data.users){
          setActiveUser(data.users)
        }
      };
    }
  };

  const onSendMessage = () => {
    if (sendMessage.replace(/\n/g, "").length > 0) {
      client.send(sendMessage);
    }
    setSendMessage("");
  };

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <>
      <Modal
        centered
        title="Welcome Back Mentimuners"
        visible={visible}
        footer={[
          <Button key="submit" type="primary" block onClick={onSubmitModal}>
            Join
          </Button>,
        ]}
      >
        <Input
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
          onPressEnter={onSubmitModal}
        />
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
                  <div
                    className="position-sticky"
                    style={{ top: "calc(81px + 30px)", marginTop: 30 }}
                  >
                    <Input.TextArea
                      className="input-message"
                      autoSize={{ minRows: 10, maxRows: 10 }}
                      placeholder="Press enter to send the message"
                      value={sendMessage}
                      onPressEnter={onSendMessage}
                      onChange={(e) => setSendMessage(e.target.value)}
                    />
                    <Button type="primary" block className="mt-3" onClick={onSendMessage}>
                      Send
                    </Button>
                  </div>
                </Col>
                <Col lg={6} md={6}>
                  <div
                    className="mb-2 border-bottom position-sticky bg-white"
                    style={{ top: "calc(81px)", zIndex: 1010 }}
                  >
                    <p className="mb-1" style={{ paddingTop: "31px" }}>
                      Active Users
                    </p>
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
                    <List
                      itemLayout="horizontal"
                      dataSource={message}
                      renderItem={(item, i) => (
                        <motion.div style={{ x: -100 }} animate={{ x: 0 }} key={i} >
                          <List.Item>
                            <List.Item.Meta
                              avatar={<Avatar size={45} src={item.avatar} />}
                              title={<>{item.username} <small>{moment(item.received).fromNow()}</small></>}
                              description={item.message}
                            />
                          </List.Item>
                        </motion.div>
                      )}
                    />
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
