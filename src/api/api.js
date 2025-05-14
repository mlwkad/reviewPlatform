import server from './request'

export function getAllRealeases(params) {
  return server({
    url: '/api/releases',
    method: 'GET',
    params
  })
}

export function updateState(releaseID, data) {
  return server({
    url: `/api/release/${releaseID}/state`,
    method: 'PUT',
    data,
  })
}

export function signUp(data) {
  return server({
    url: '/api/signUp',
    method: 'POST',
    data,
  })
}

export function Login(data) {
  return server({
    url: '/api/checkLogin',
    method: 'POST',
    data,
  })
}

export function deleteStatus(releaseID, data) {
  // data结构：{deleteStatus:0或1}
  return server({
    url: `/api/release/${releaseID}/delete-status`,
    method: 'PUT',
    data,
  })
}

export function getDeletedReleases(data) {
  // data结构：{limit:number,offset:number}
  return server({
    url: '/api/releases/deleted',
    method: 'GET',
    data,
  })
}

export const deleteRelease = (releaseID, data) => {
  // data结构：{userID:string}
  console.log(data)
  return server({
    url: `/api/release/${releaseID}`,
    method: 'DELETE',
    data
  })
}
