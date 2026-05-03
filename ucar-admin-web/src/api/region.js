import request from '@/utils/request'

export const getProvinces = () => {
  return request.get('/region/provinces')
}

export const getAllProvinces = () => {
  return request.get('/region/provinces/all')
}

export const getCities = (provinceId) => {
  return request.get(`/region/cities/${provinceId}`)
}

export const getAllCities = (provinceId) => {
  return request.get(`/region/cities/${provinceId}/all`)
}

export const getDistricts = (cityId) => {
  return request.get(`/region/districts/${cityId}`)
}

export const getAllDistricts = (cityId) => {
  return request.get(`/region/districts/${cityId}/all`)
}

export const getRegionTree = () => {
  return request.get('/region/tree')
}

export const searchRegions = (regionName) => {
  return request.get('/region/search', { params: { regionName } })
}

export const searchAllRegions = (regionName, regionLevel) => {
  return request.get('/region/search/all', {
    params: { regionName, regionLevel },
  })
}

export const getRegionById = (id) => {
  return request.get(`/region/${id}`)
}

export const getNextSortOrder = (parentId) => {
  return request.get('/region/next-sort-order', {
    params: { parentId },
  })
}

export const createRegion = (data) => {
  return request.post('/region', data)
}

export const updateRegion = (id, data) => {
  return request.put(`/region/${id}`, data)
}

export const deleteRegion = (id) => {
  return request.delete(`/region/${id}`)
}

export const batchUpdateRegionStatus = (ids, status) => {
  return request.put('/region/batch/status', { ids, status })
}

export const rebuildRegionClosure = () => {
  return request.post('/region/closure/rebuild')
}

export const getRegionRootId = (regionId) => {
  return request.get(`/region/${regionId}/closure/root`)
}

export const getRegionDirectChildren = (ancestorId) => {
  return request.get(`/region/${ancestorId}/closure/direct-children`)
}

export const getRegionAllDescendants = (ancestorId) => {
  return request.get(`/region/${ancestorId}/closure/descendants`)
}

export const getRegionDirectParent = (regionId) => {
  return request.get(`/region/${regionId}/closure/direct-parent`)
}

export const getRegionAllAncestors = (regionId) => {
  return request.get(`/region/${regionId}/closure/ancestors`)
}

export const getAllRegions = () => {
  return request.get('/region/tree')
}

export const getAllProvincesForManagement = getAllProvinces
export const getAllCitiesByProvinceId = getAllCities
export const getAllDistrictsByCityId = getAllDistricts