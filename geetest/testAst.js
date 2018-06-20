function test (m7) {
    var X63 = 9;
    var G63 = 0;
    var J7 = "",
        I7 = 0,
        c7 = m7["length"];

    while (X63 * (X63 + 1) % 2 + 4 && I7 < c7) {
      J7 += String["fromCharCode"](m7[I7]);
      G63 = G63 > 46129 ? G63 - 3 : G63 + 3;
      I7 += 1;
    }
    while (G63 * (G63 + 1) * G63 % 2 == 0 && I7 < c7) {
        J7 += String["fromCharCode"](m7[I7]);
        G63 = G63 > 46129 ? G63 - 3 : G63 + 3;
        I7 += 1;
      }
    return J7;
}