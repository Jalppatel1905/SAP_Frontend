import React, { useState } from 'react'
import styled from 'styled-components'
import Fab from '@mui/material/Fab'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import ShareIcon from '@mui/icons-material/Share'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import CloseIcon from '@mui/icons-material/Close'
import LightbulbIcon from '@mui/icons-material/Lightbulb'
import ArrowRightIcon from '@mui/icons-material/ArrowRight'
import VideogameAssetIcon from '@mui/icons-material/VideogameAsset'
import VideogameAssetOffIcon from '@mui/icons-material/VideogameAssetOff'

import { BackgroundMode } from '../types/BackgroundMode'
import { setShowJoystick, toggleBackgroundMode } from '../stores/UserStore'
import { useAppSelector, useAppDispatch } from '../hooks'
import { getAvatarString, getColorByString } from '../util'

const Backdrop = styled.div`
  position: fixed;
  display: flex;
  gap: 16px;
  bottom: 24px;
  right: 24px;
  align-items: flex-end;
  z-index: 1000;

  .wrapper-group {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
`

const Wrapper = styled.div`
  position: relative;
  font-size: 16px;
  color: #eee;
  background: #1c1f2e;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.5);
  border-radius: 20px;
  padding: 20px 40px 20px 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 320px;

  .close {
    position: absolute;
    top: 12px;
    right: 12px;
    color: #bbb;
  }

  .tip {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    font-size: 14px;
    color: #ccc;
  }

  ul {
    padding-left: 20px;
    margin: 10px 0 0 0;
  }

  li {
    margin-bottom: 8px;
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
`

const Title = styled.h3`
  font-size: 22px;
  color: #eee;
  text-align: left;
  margin: 0 0 10px 0;
`

const RoomName = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 10px;

  h3 {
    font-size: 20px;
    color: #eee;
    margin: 0;
  }
`

const RoomDescription = styled.div`
  font-size: 14px;
  color: #c2c2c2;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
`

const StyledFab = styled(Fab)<{ target?: string }>`
  background: #2d3148;
  color: #eee;
  &:hover {
    background: #394065;
    color: #1ea2df;
  }
`

export default function HelperButtonGroup() {
  const [showControlGuide, setShowControlGuide] = useState(false)
  const [showRoomInfo, setShowRoomInfo] = useState(false)
  const showJoystick = useAppSelector((state) => state.user.showJoystick)
  const backgroundMode = useAppSelector((state) => state.user.backgroundMode)
  const roomJoined = useAppSelector((state) => state.room.roomJoined)
  const roomId = useAppSelector((state) => state.room.roomId)
  const roomName = useAppSelector((state) => state.room.roomName)
  const roomDescription = useAppSelector((state) => state.room.roomDescription)
  const dispatch = useAppDispatch()

  return (
    <Backdrop>
      <div className="wrapper-group">
        {roomJoined && (
          <Tooltip title={showJoystick ? 'Disable virtual joystick' : 'Enable virtual joystick'}>
            <StyledFab size="small" onClick={() => dispatch(setShowJoystick(!showJoystick))}>
              {showJoystick ? <VideogameAssetOffIcon /> : <VideogameAssetIcon />}
            </StyledFab>
          </Tooltip>
        )}

        {showRoomInfo && (
          <Wrapper>
            <IconButton className="close" onClick={() => setShowRoomInfo(false)} size="small">
              <CloseIcon />
            </IconButton>
            <RoomName>
              <Avatar style={{ background: getColorByString(roomName) }}>
                {getAvatarString(roomName)}
              </Avatar>
              <h3>{roomName}</h3>
            </RoomName>
            <RoomDescription>
              <ArrowRightIcon fontSize="small" /> ID: {roomId}
            </RoomDescription>
            <RoomDescription>
              <ArrowRightIcon fontSize="small" /> Description: {roomDescription}
            </RoomDescription>
            <div className="tip">
              <LightbulbIcon fontSize="small" /> Shareable link coming up 😄
            </div>
          </Wrapper>
        )}

        {showControlGuide && (
          <Wrapper>
            <IconButton className="close" onClick={() => setShowControlGuide(false)} size="small">
              <CloseIcon />
            </IconButton>
            <Title>Controls</Title>
            <ul>
              <li><strong>W, A, S, D</strong> or <strong>arrow keys</strong> to move</li>
              <li><strong>E</strong> to sit down (when facing a chair)</li>
              <li><strong>R</strong> to use computer to screen share (when facing a computer)</li>
              <li><strong>Enter</strong> to open chat</li>
              <li><strong>ESC</strong> to close chat</li>
            </ul>
            <div className="tip">
              <LightbulbIcon fontSize="small" /> Video starts if you’re near someone
            </div>
          </Wrapper>
        )}
      </div>

      <ButtonGroup>
        {roomJoined && (
          <>
            <Tooltip title="Room Info">
              <StyledFab
                size="small"
                onClick={() => {
                  setShowRoomInfo(!showRoomInfo)
                  setShowControlGuide(false)
                }}
              >
                <ShareIcon />
              </StyledFab>
            </Tooltip>
            <Tooltip title="Control Guide">
              <StyledFab
                size="small"
                onClick={() => {
                  setShowControlGuide(!showControlGuide)
                  setShowRoomInfo(false)
                }}
              >
                <HelpOutlineIcon />
              </StyledFab>
            </Tooltip>
          </>
        )}

        <Tooltip title="Switch Background Theme">
          <StyledFab size="small" onClick={() => dispatch(toggleBackgroundMode())}>
            {backgroundMode === BackgroundMode.DAY ? <DarkModeIcon /> : <LightModeIcon />}
          </StyledFab>
        </Tooltip>
      </ButtonGroup>
    </Backdrop>
  )
}
