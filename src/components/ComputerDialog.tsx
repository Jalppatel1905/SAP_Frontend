import React from 'react'
import styled from 'styled-components'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'

import { useAppSelector, useAppDispatch } from '../hooks'
import { closeComputerDialog } from '../stores/ComputerStore'

import Video from './Video'

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(10, 10, 10, 0.85);
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
`

const Wrapper = styled.div`
  width: 100%;
  max-width: 1200px;
  height: 90%;
  background: #222639;
  border-radius: 16px;
  padding: 24px;
  color: #eee;
  position: relative;
  display: flex;
  flex-direction: column;
  box-shadow: 0px 0px 10px #00000088;
  overflow: hidden;

  .close {
    position: absolute;
    top: 16px;
    left: 16px;
    color: #fff;
    background: #444;
    border-radius: 50%;
    transition: background 0.2s ease;

    &:hover {
      background: #ff4c4c;
    }
  }
`

const Toolbar = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;

  button {
    font-weight: bold;
  }
`

const VideoGrid = styled.div`
  flex: 1;
  min-height: 0;
  display: grid;
  grid-gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  overflow-y: auto;

  .video-container {
    position: relative;
    background: black;
    border-radius: 8px;
    overflow: hidden;

    video {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .player-name {
      position: absolute;
      bottom: 12px;
      left: 12px;
      color: #fff;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
      font-size: 14px;
      font-weight: 500;
    }
  }
`

function VideoContainer({ playerName, stream }) {
  return (
    <div className="video-container">
      <Video srcObject={stream} autoPlay />
      {playerName && <div className="player-name">{playerName}</div>}
    </div>
  )
}

export default function ComputerDialog() {
  const dispatch = useAppDispatch()
  const playerNameMap = useAppSelector((state) => state.user.playerNameMap)
  const shareScreenManager = useAppSelector((state) => state.computer.shareScreenManager)
  const myStream = useAppSelector((state) => state.computer.myStream)
  const peerStreams = useAppSelector((state) => state.computer.peerStreams)

  return (
    <Backdrop>
      <Wrapper>
        <IconButton
          aria-label="close dialog"
          className="close"
          onClick={() => dispatch(closeComputerDialog())}
        >
          <CloseIcon />
        </IconButton>

        <Toolbar>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => {
              if (shareScreenManager?.myStream) {
                shareScreenManager.stopScreenShare()
              } else {
                shareScreenManager?.startScreenShare()
              }
            }}
          >
            {shareScreenManager?.myStream ? 'Stop sharing' : 'Share Screen'}
          </Button>
        </Toolbar>

        <VideoGrid>
          {myStream && <VideoContainer stream={myStream} playerName="You" />}

          {[...peerStreams.entries()].map(([id, { stream }]) => {
            const playerName = playerNameMap.get(id)
            return <VideoContainer key={id} playerName={playerName} stream={stream} />
          })}
        </VideoGrid>
      </Wrapper>
    </Backdrop>
  )
}
