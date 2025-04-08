import React, { useState } from 'react'
import styled from 'styled-components'
import {
  Button,
  Paper,
  TableContainer,
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  Tooltip,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  Alert,
  Avatar,
} from '@mui/material'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import LockIcon from '@mui/icons-material/Lock'

import { useAppSelector } from '../hooks'
import { getAvatarString, getColorByString } from '../util'
import phaserGame from '../PhaserGame'
import Bootstrap from '../scenes/Bootstrap'

const MessageText = styled.p`
  margin: 20px;
  font-size: 18px;
  color: #eee;
  text-align: center;
`

const CustomRoomTableContainer = styled(({ component, ...rest }) => (
  <TableContainer component={component} {...rest} />
))`
  max-height: 500px;
  background: #1d2233;
  border-radius: 10px;
  box-shadow: 0 0 10px #0000004f;

  table {
    min-width: 650px;

    thead {
      background-color: #2b2f4c;
    }

    th {
      color: #bbb;
      font-weight: 600;
    }

    td {
      color: #eee;
    }
  }
`

const TableRowWrapper = styled(TableRow)`
  &:hover {
    background-color: #2a2f47;
  }

  &:last-child td,
  &:last-child th {
    border: 0;
  }

  .avatar {
    height: 30px;
    width: 30px;
    font-size: 15px;
  }

  .name, .description {
    overflow-wrap: anywhere;
  }

  .description {
    color: #ccc;
  }

  .join-wrapper {
    display: flex;
    gap: 5px;
    align-items: center;
  }

  .lock-icon {
    font-size: 18px;
  }
`

const PasswordDialog = styled(Dialog)`
  .MuiDialog-paper {
    background: #2b2f4c;
    padding: 20px;
  }

  .dialog-content {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .MuiFormLabel-root,
  .MuiInputBase-root {
    color: #eee !important;
  }

  .MuiOutlinedInput-notchedOutline {
    border-color: #666 !important;
  }
`

export const CustomRoomTable = () => {
  const [password, setPassword] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('')
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showPasswordError, setShowPasswordError] = useState(false)
  const [passwordFieldEmpty, setPasswordFieldEmpty] = useState(false)
  const lobbyJoined = useAppSelector((state) => state.room.lobbyJoined)
  const availableRooms = useAppSelector((state) => state.room.availableRooms)

  const handleJoinClick = (roomId: string, password: string | null) => {
    if (!lobbyJoined) return
    const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap
    bootstrap.network
      .joinCustomById(roomId, password)
      .then(() => bootstrap.launchGame())
      .catch((error) => {
        console.error(error)
        if (password) setShowPasswordError(true)
      })
  }

  const handlePasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const isValidPassword = password !== ''
    if (isValidPassword === passwordFieldEmpty) setPasswordFieldEmpty(!passwordFieldEmpty)
    if (isValidPassword) handleJoinClick(selectedRoom, password)
  }

  const resetPasswordDialog = () => {
    setShowPasswordDialog(false)
    setPassword('')
    setPasswordFieldEmpty(false)
    setShowPasswordError(false)
  }

  return availableRooms.length === 0 ? (
    <MessageText>There are no custom rooms now, create one or join the public lobby.</MessageText>
  ) : (
    <>
      <CustomRoomTableContainer component={Paper}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>ID</TableCell>
              <TableCell align="center">
                <PeopleAltIcon />
              </TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {availableRooms.map(({ roomId, metadata, clients }) => {
              const { name, description, hasPassword } = metadata
              return (
                <TableRowWrapper key={roomId}>
                  <TableCell>
                    <Avatar className="avatar" style={{ background: getColorByString(name) }}>
                      {getAvatarString(name)}
                    </Avatar>
                  </TableCell>
                  <TableCell className="name">{name}</TableCell>
                  <TableCell className="description">{description}</TableCell>
                  <TableCell>{roomId}</TableCell>
                  <TableCell align="center">{clients}</TableCell>
                  <TableCell align="right">
                    <Tooltip title={hasPassword ? 'Password required' : 'Join Room'}>
                      <Button
                        variant="contained"
                        color="secondary"
                        size="small"
                        onClick={() => {
                          if (hasPassword) {
                            setSelectedRoom(roomId)
                            setShowPasswordDialog(true)
                          } else {
                            handleJoinClick(roomId, null)
                          }
                        }}
                      >
                        <div className="join-wrapper">
                          {hasPassword && <LockIcon className="lock-icon" />}
                          Join
                        </div>
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRowWrapper>
              )
            })}
          </TableBody>
        </Table>
      </CustomRoomTableContainer>

      <PasswordDialog open={showPasswordDialog} onClose={resetPasswordDialog}>
        <form onSubmit={handlePasswordSubmit}>
          <DialogContent className="dialog-content">
            <MessageText>This is a private room. Please enter the password:</MessageText>
            <TextField
              autoFocus
              fullWidth
              error={passwordFieldEmpty}
              helperText={passwordFieldEmpty && 'Required'}
              value={password}
              label="Password"
              type="password"
              variant="outlined"
              color="secondary"
              onInput={(e) => {
                setPassword((e.target as HTMLInputElement).value)
              }}
            />
            {showPasswordError && (
              <Alert severity="error" variant="outlined">
                Incorrect Password!
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={resetPasswordDialog} color="secondary">
              Cancel
            </Button>
            <Button type="submit" color="secondary" variant="contained">
              Join
            </Button>
          </DialogActions>
        </form>
      </PasswordDialog>
    </>
  )
}
