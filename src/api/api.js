import server from './request'

export function getAllRealeases(data) {
    return server({
        url: '/api/releases',
        method: 'GET',
        data
    })
}

export function updateState(releaseID,data) {
    return server({
        url: `/api/release/${releaseID}/state`,
        method: 'PUT',
        data
    })
}

export function signUp(data) {
    return server({
        url: '/api/signUp',
        method: 'POST',
        data
    })
}

export function Login(data) {
    return server({
        url:'/api/checkLogin',
        method: 'POST',
        data
    })
}
