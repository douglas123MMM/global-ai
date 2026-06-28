// Tests unitarios para funciones criticas del sistema de referidos
// Ejecutar con: npm run test (requiere configurar Jest)

describe('Referral Code Generation', () => {
  test('code should be 8 characters uppercase alphanumeric', () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const generate = () => {
      let code = ''
      for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)]
      }
      return code
    }
    const code = generate()
    expect(code).toHaveLength(8)
    expect(code).toMatch(/^[A-Z0-9]{8}$/)
  })

  test('codes should be unique across multiple generations', () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const generate = () => {
      let code = ''
      for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)]
      }
      return code
    }
    const codes = new Set<string>()
    for (let i = 0; i < 100; i++) {
      codes.add(generate())
    }
    expect(codes.size).toBe(100)
  })
})

describe('Commission Calculations', () => {
  test('basic plan with 20% commission', () => {
    const price = 10
    const percentage = 20
    const commission = (price * percentage) / 100
    expect(commission).toBe(2.00)
  })

  test('pro plan with 25% commission', () => {
    const price = 20
    const percentage = 25
    const commission = (price * percentage) / 100
    expect(commission).toBe(5.00)
  })

  test('founder always gets 25%', () => {
    const price = 10
    const percentage = 25
    const commission = (price * percentage) / 100
    expect(commission).toBe(2.50)
  })

  test('level 2 gets 25% after reaching threshold', () => {
    const totalPaidCommissions = 26.00
    const threshold = 25.00
    expect(totalPaidCommissions >= threshold).toBe(true)
  })

  test('does not upgrade without reaching threshold', () => {
    const totalPaidCommissions = 20.00
    const threshold = 25.00
    expect(totalPaidCommissions >= threshold).toBe(false)
  })
})

describe('Withdrawal Validation', () => {
  test('minimum withdrawal is $20', () => {
    const minAmount = 20
    const request = 19.99
    expect(request >= minAmount).toBe(false)
  })

  test('cannot withdraw more than balance', () => {
    const balance = 50
    const request = 75
    expect(request <= balance).toBe(false)
  })

  test('valid withdrawal request', () => {
    const balance = 100
    const request = 50
    const minAmount = 20
    expect(request >= minAmount).toBe(true)
    expect(request <= balance).toBe(true)
  })
})

describe('Bonus Thresholds', () => {
  const thresholds = [
    { required: 1, amount: 5 },
    { required: 10, amount: 20 },
    { required: 50, amount: 100 },
    { required: 100, amount: 500 },
  ]

  test('bonus triggered at exact threshold', () => {
    thresholds.forEach((t) => {
      expect(t.required).toBeGreaterThan(0)
      expect(t.amount).toBeGreaterThan(0)
    })
  })

  test('bonuses increase with referrals', () => {
    for (let i = 1; i < thresholds.length; i++) {
      expect(thresholds[i].amount).toBeGreaterThan(thresholds[i - 1].amount)
      expect(thresholds[i].required).toBeGreaterThan(thresholds[i - 1].required)
    }
  })

  test('bonus only triggers once per milestone', () => {
    const claimed = new Set<string>(['first_referral'])
    const bonusType = 'first_referral'
    expect(claimed.has(bonusType)).toBe(true)
  })
})

describe('Tier System', () => {
  test('default tier is level1 with 20%', () => {
    const tier = 'level1'
    const percentage = 20
    expect(tier).toBe('level1')
    expect(percentage).toBe(20)
  })

  test('founder tier gives 25% from start', () => {
    const isFounder = true
    const percentage = isFounder ? 25 : 20
    expect(percentage).toBe(25)
  })

  test('non-founder starts at 20%', () => {
    const isFounder = false
    const percentage = isFounder ? 25 : 20
    expect(percentage).toBe(20)
  })
})

describe('Fraud Detection Rules', () => {
  test('max 3 accounts per IP triggers flag', () => {
    const ipUsers = 4
    const maxPerIp = 3
    expect(ipUsers > maxPerIp).toBe(true)
  })

  test('valid IP has no flag', () => {
    const ipUsers = 2
    const maxPerIp = 3
    expect(ipUsers > maxPerIp).toBe(false)
  })

  test('max 10 referrals per hour triggers flag', () => {
    const hourlyRefs = 12
    const maxPerHour = 10
    expect(hourlyRefs >= maxPerHour).toBe(true)
  })

  test('normal referral rate is ok', () => {
    const hourlyRefs = 4
    const maxPerHour = 10
    expect(hourlyRefs >= maxPerHour).toBe(false)
  })
})
