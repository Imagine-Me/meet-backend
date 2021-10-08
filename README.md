## Meet backend (Signaling server)

This is the signalling server for the meet application using webRTC. The front-end can be found [here](https://github.com/Imagine-Me/meet)

### Requirements

- node version > 12
- mongoDB


### Description
To establish connection between to peers, one need to send an `offer` and the other need reply with an `answer`. For this (mainly) and for some other usage we are using a signalling server that helps to make connection  between to peers.

#### Installation

Clone the repo and install the required package using 

```
npm i
```

#### Starting development server

To start development server
```
npm run dev
```
This will restart server whenever you make changes to app.
