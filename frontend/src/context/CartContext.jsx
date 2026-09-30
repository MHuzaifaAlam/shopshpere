import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { api } from '../services/api'

const CartContext = createContext(null)

const emptyCart = { items: [], total_amount: 0 }

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const [cart, setCart] = useState(emptyCart)

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(emptyCart)
      return
    }

    try {
      const { data } = await api.get('/api/orders/cart/')
      setCart(data || emptyCart)
    } catch {
      setCart(emptyCart)
    }
  }, [isAuthenticated])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  const addToCart = async (product, quantity = 1) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to add items to your cart.')
    }

    await api.post('/api/orders/cart/items/', {
      product: product.id,
      quantity,
    })

    await refreshCart()
  }

  const updateCartItem = async (itemId, quantity) => {
    if (!Number.isFinite(quantity) || quantity < 1) {
      return
    }

    await api.patch(`/api/orders/cart/items/${itemId}/`, { quantity })
    await refreshCart()
  }

  const removeCartItem = async (itemId) => {
    await api.delete(`/api/orders/cart/items/${itemId}/`)
    await refreshCart()
  }

  const value = useMemo(
    () => ({
      cart,
      refreshCart,
      addToCart,
      updateCartItem,
      removeCartItem,
    }),
    [cart, refreshCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }

  return context
}
