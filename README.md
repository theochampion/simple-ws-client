# Join real-time chat service test client (SWSC)

This test client allow you to explore Join realtime chat services as well as chat mgmt endpoints trough a command line style interface.

## Getting started:

#### Install dependencies:

```bash
cd simple-ws-client
yarn
```

#### Run

```javascript
node index.js [--host <host> ] [--port <port>] --email <email> --pass <password>

//example
node index.js  --email alicia.key@yahoo.fr --pass gotthekeys
Logged in as Alicia Keys (5cbd8da83407747ad45faca7)
###############################################
#              Welcome to SWSC                #
#                                             #
# Select a conversation to connect to it or   #
# enter one of the available commands :       #
#                                             #
#  <idx> - connect to selected conversation   #                                        #
#  new   - create new conversation            #
#  exit  - exit the program                   #
#                                             #
###############################################
SWSC $>
```
