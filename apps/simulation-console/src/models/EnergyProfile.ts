/**
 * Simulates organic energy generation and consumption curves.
 */
export class EnergyProfile {
  /**
   * Generates a realistic load for a suburban house based on the hour.
   * High peaks at 7am and 6pm (18:00).
   * @param hourOfDay 0-23
   * @param baseLoadKw The average baseline load for the home
   * @returns Current consumption in kW
   */
  static generateLoad(hourOfDay: number, baseLoadKw: number): number {
    let multiplier = 1.0;
    
    // Morning peak (6am - 9am)
    if (hourOfDay >= 6 && hourOfDay <= 9) {
      multiplier = 2.5; 
    } 
    // Evening peak (5pm - 10pm)
    else if (hourOfDay >= 17 && hourOfDay <= 22) {
      multiplier = 3.5;
    } 
    // Deep night low (1am - 5am)
    else if (hourOfDay >= 1 && hourOfDay <= 5) {
      multiplier = 0.4;
    }

    // Add noise +/- 20%
    const noise = (Math.random() * 0.4) - 0.2;
    multiplier += noise;

    return Math.max(0, baseLoadKw * multiplier);
  }

  /**
   * Generates a realistic solar curve.
   * Parabolic curve peaking at 1pm (13:00).
   * @param hourOfDay 0-23
   * @param maxCapacityKw The nameplate capacity of the solar array
   * @returns Current generation in kW
   */
  static generateSolar(hourOfDay: number, maxCapacityKw: number): number {
    // Sun is down
    if (hourOfDay < 6 || hourOfDay > 19) {
      return 0;
    }

    // Simple parabola peaking at noon-1pm (Hour 12.5)
    // equation: y = -a(x-h)^2 + k
    // vertex at (12.5, 1.0 multiplier)
    // roots around 6 and 19
    const h = 12.5;
    const a = 1 / Math.pow(6.5, 2); // makes it hit 0 around 6 and 19
    
    let multiplier = -a * Math.pow((hourOfDay - h), 2) + 1;
    
    if (multiplier < 0) multiplier = 0;

    // Add weather noise / cloud cover (only reduces or slightly bumps)
    // Max 10% structural bump, up to 40% reduction from clouds
    const noise = (Math.random() * 0.5) - 0.4;
    multiplier += noise;

    return Math.max(0, maxCapacityKw * multiplier);
  }
}
