export const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export const formatCurrency = (value) => {
  const amount = Number(value ?? 0)
  return currencyFormatter.format(amount)
}

export const buildImageUrl = (imagePath) => {
  if (!imagePath) {
    return null
  }

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }

  const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

  if (imagePath.startsWith('/media/')) {
    return `${baseUrl}${imagePath}`
  }

  if (imagePath.startsWith('/')) {
    return `${baseUrl}${imagePath}`
  }

  return `${baseUrl}/media/${imagePath.replace(/^\/+/, '')}`
}

export const getPrimaryImage = (product) => {
  if (!product || !Array.isArray(product.images)) {
    return null
  }

  const primaryImage = product.images.find((image) => image.is_primary) || product.images[0]
  return primaryImage?.image || null
}
