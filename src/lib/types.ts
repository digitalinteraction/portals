export interface RoomMember {
  id: string
  polite: boolean
}
export interface InfoSignal {
  id: string
  members: RoomMember[]
}
export interface ErrorSignal {
  code: string
}

export type DescriptionSignal = RTCSessionDescription
export type CandidateSignal = RTCIceCandidate | undefined

export function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
