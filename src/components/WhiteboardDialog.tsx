import React from 'react'
import styled from 'styled-components'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'

import { useAppSelector, useAppDispatch } from '../hooks'
import { closeWhiteboardDialog } from '../stores/WhiteboardStore'

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
`

const Wrapper = styled.div`
  width: 90%;
  height: 90%;
  background: #1f1f2f;
  border-radius: 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const CloseButton = styled(IconButton)`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  color: white;
`

const TldrawWrapper = styled.div`
  flex: 1;
  border-radius: 20px;
  overflow: hidden;
  height: 100%;
`

export default function WhiteboardDialog() {
  const whiteboardOpen = useAppSelector((state) => state.whiteboard.whiteboardDialogOpen)
  const dispatch = useAppDispatch()

  if (!whiteboardOpen) return null

  return (
    <Backdrop>
      <Wrapper>
        <CloseButton onClick={() => dispatch(closeWhiteboardDialog())}>
          <CloseIcon />
        </CloseButton>
        <TldrawWrapper>
          <Tldraw />
        </TldrawWrapper>
      </Wrapper>
    </Backdrop>
  )
}
