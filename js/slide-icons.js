// Bargain Drop — Universal Navbar, Official Logo & Slide-Out Menu Iconify Engine
// Strictly enforces Tri-Tone Palette:
//   Pure Crimson Red:      #DC2626
//   Deep Midnight Black:   #111827
//   Vibrant Accent Yellow: #FACC15
(function (global) {
  "use strict";

  var OFFICIAL_LOGO_DATA_URI = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAQDAwQDAwQEBAQFBQQFBwsHBwYGBw4KCggLEA4RERAOEA8SFBoWEhMYEw8QFh8XGBsbHR0dERYgIh8cIhocHRz/2wBDAQUFBQcGBw0HBw0cEhASHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBz/wAARCACgAHkDASIAAhEBAxEB/8QAHQAAAgIDAQEBAAAAAAAAAAAABwkGCAABBQQCA//EAFYQAAEDAgMCBA4MCggHAQAAAAECAwQABQYHERIhCDFBUQkTIjVhcXWBkZOhsbPCFRYXMjM2N0JVcnTSFBhSVGKCkpTB0SMkRVZjlbLTJjRTZHODouH/xAAcAQACAgMBAQAAAAAAAAAAAAAABQYHAgMEAQj/xAA7EQABAgMEBQoEBAcAAAAAAAABAAIDBBEFEiExBgdBUYETFCIzNWFxkaGxcpLB8BUyQuIXNFKCstHh/9oADAMBAAIRAxEAPwCgbDTrzqWmUKW64dlKEjUqJ5AKLmFsmC42iTfn1tqOhEVkjUfWV/AeGuhk/g9uJBF+lN6ypGojBQ+DRxFXbPm7dFNSkoQpSlBKUjUknQAUtmZsg3IatvRHQmBEl2z9pC9exa3ZTYTvruypn3RqNl7hiKgJTZ4y+y6Csnwmv39pGHPoSB4kVwrpmzZILymoyH5pSdCtoAI7xJ3+Cuf7s8D6Kl+MRWkQph2OKkb7W0Wl3GETDw3NBHmAQpd7SMOadZIHiRWvaRhz6EgeJFRL3Z4H0VL8Yis92eB9FS/GIo5CZ7/NY/juiu+H8n7VLfaRhwf2JA8SKz2j4c+hIHiRUS92eB9FS/GIrPdngfRUvxiKOQme/wA0fjuiu+H8n7VKHcvsMPAhVlijX8gFPmNcS4ZO4dlpIYEqIrk6W5tAd5Wvnr8Gc47So6OwZzY5wEq/jXet2YmHLiQlNwSys8SZCS35Tu8tF2ZZjismxdFLQ6A5Ik9wafoUML1kxd4KFrtshqe3x7BHS3PAdx8NDqXDk22StiUw4w+jcpDqCkjvGrdIWl1CVoUlSFDUKSdQe/XLv2GrZiWKY9xjJdAHUODctvspVyeatkKecMIgqk1r6uJaM0xLNfcduJq08cx6qqNbJJJJ4zUvxtl/Nwi900EyLatWjcgDTQ/kqHIfIaiB0JOg0HNTJjw8XmqpJ2SjyMZ0vMtLXDYfvEd6wknTsbq1WyRu0GlarJcqt9DitwYjEVlOy0whLaBzADQUOM3769FiRLSyooTKBceIPvkA6BPaJ18FE2gvnJ1/gfZPXVSaTAdGFV9BabxnSthxGwTSt1uG4nEeWCHPZJ3V02sOXl9tLjVouTjahqlaIjhBHOCE0c+BTgy0Y0z1hM3qI1Mi2yC/cER3khTa3UFCUFQO4gFza0PKBTYQkJGg3AU7JXz6kXe1a+/Ql0/cnfu1ntWvv0JdP3J37tPR3c/lrN3P5a8qhIu9q19+hLp+5O/drRwvfANTZbpoP+yd+7T0t3P5azdz+WiqEh6TDkQjpKjvRzzPNqR/qAr8RvGo3g8tPem26Hc2FMTIrEllQ0KHmwtJHaINBTMPghZVZgsvLVh1myXJY6mdZgIy0nnKAOlq76e/XtUJUVjxNdMOu7cCUtCNeqaV1Tau2k7vBvo04Ox9DxQkR3EiNcgNSyTqF85QeXtcY7NebPrgsYsyPWq4LULzhVa9lF1jtlPSSToEvo39LJ5DqUnnB3UDGXnIzqHWlqbdbUFJWk6FJHEQa0RpZkUd+9SfR/SudseIA116FtacuG4+m9WllxGJ8V2NJaQ9HeTsrbWNQoVW3H2DXMI3bYRtLt8jVUdw83Kk9keXcaNuAsWjFFrPTikXCNol9I3bXMsDmPkNezGWHG8UWCTBIHTwOmMKPzXBrp4eLv0sgxHS8S67LarU0gsuW0mssTkpi8CrTtO9p9u48VVsgbtDrWq+3GlsrUhaSlaSQUnjBB00r4pwqEIoriUF85Ov8D7J66qNFBfOTr/A+yeuqk8j1wV+6wexX/E33Rg6H98u8nuHK9IzTJ8ZTpFtwjfpsVwtSY0CQ604ADsrS2og7924gUtjof3y7ye4cr0jNMfzA+ImJ+5kr0K6cnNUElTo4YGdRQgnHUrUpB/5ONzf+Ot/jf51f36lfukb/boHt/Bo+qPNX1WVEI3fjf51f36lfukb/brBwwM6gdfb1J/c43+3QP6Yj8tH7QrYIVxEEdg0UQrIWHhz5xWd9C5d3tt3aSdS1OtzaQr9ZrYNWryR4cmF8xZ8ax4qhpw1fZCg2y6p7bhyFniSHDoW1E8QVuPFtE7qWLWc44wa8ohPduVth3m3yYFwjMyoMptTTzDyAtDiFDQpUk7iCOSlJ8KTIlWR+YJjwUuLwvdwqTbHF7y2AerYJ5SgkaHlSpJ49aujwG85JuY2Xk3D96kqk3nC622Q+4rVb0VYPSioneVJKVIJ5QE67zXa4bmB2cW5DXif0sKnYdcRc2FabwlJ2XRrzFtSj+qK8GCEsTBN8NgxHEklWjDiukvc2wo6a946HvVY2qokcY5as3h2abjYLbKJ1U9HQpR7Om/y0ttBmT1burGfc5seSccBRw44H6IBZp2hNpxjLLadlqWBJSAN2qvff/QPhqF0YM9IgDlmlAb1JcaJ7RBHnNB+uuWdehAqBaVSYlLXmITRheqP7ul9VcSgvnJ1/gfZPXVRooL5ydf4H2T11UtkeuCt3WD2K/4m+6MHQ/vl3k9w5XpGaY/mB8RMT9zJXoV0uDof3y7ye4cr0jNMfzA+ImJ+5kr0K6cnNUEkcN/Bo+qPNXewU0h7GWHWnUJW2u5RUqQsahQLyQQQeMVwW/g0fVHmqQYG+O2Gu6cX0yK1zHUv8D7FZM/ME0FWBMK7Sv8AhmycZ/s9nn+rVHuF9aoFnzRhMW6DFhsG0srLcZlLaSrpjm/RIA13DfTAVe+X2z56oTw0PlYg9x2fSO1R2ruYixLYDXvJF12ZPcpJarGiXqBtCrtWVlZ2eQVe6jKuH0Oh55OauKmUk/g67JtLHJtJkN7P+pVXpztZZfybx+2/p0o2KdrqP8BdAzgM5JTsusFz8U36MuNesShstRnU6LjxEalG0ORSyoqI5AE679amfDJxszg3ILEjZdCZt7Sm1Rk7WhUXT1fgbCzWO1CUkjelJPHoKsdgQFODrMDx/g6fOarq20t91LTaSXHFBKQOUk6CrQ2yELdbYkNPFHaQ34BpXBaLuiArP1YwHGajx9gaBxJr9EMs8yPY2zj5xecI7WyKCVFfPKcly52uEFalllTqhzbR0HkTQorbKCkIKN6bxmxbbjluyg8mgFXEoL5ydf4H2T11UaKC+cnX+B9k9dVcEj1wVpawexX/ABN90YOh/fLvJ7hyvSM0x/MD4iYn7mSvQrpcHQ/vl3k9w5XpGaY/mB8RMT9zJXoV05OaoJI4b+DR9UeapBgb47Ya7pxfTIqPt/Bo+qPNUgwN8dsNd04vpkVqmepf4H2KyZ+YJsKvfL7Z89UJ4Z/ysQe47HpHavsr3y+2fPVCOGiNc1oYB0Js7I1/9jtUTq47ZHwO+ik1rfy3ELjZTcFDMbN62R7xa4UW3WGQohq43N4todAOhKEJBWoa7tdADpx1drJPgS4Oyxlxr1fnjibELBC2lyGgiLGWN4Uhnfqocilk84ANT/g45m4Ux3lbhhqxToiZUC3sRJNtDiQ9FcbbCVJKOPTUag6aEHWjBrrV91UXXjut2g2K2SrlcpbMOBEbU6/IfWEIbQBqVKJ4hSmuFNn8vPLHCVW8ut4Us+0zbWlggvEnq5ChyFeg0HIkDlJpg/CUyLm554ORa4GJZlplRFF1qNtaw5a+QPoA1OhG5QJ2dSdDSn8ZYMvmAMSTsPYigOwLtCVsusr36g7wpKhuUkjeFDcRQEKQ5WYYVc7sLq+j+pwVaoJG5bvIO9x+CjcpQQkqUQEgakniAqAZYYqiXC2t2jpTceZERuQgaJdTyqHZ5/DU5mw27hCkRHtrpUhtTa9k6HQjQ6Hv0lm3OdFN/BfQehkrLS1jtdJODy7EnLpbjupl67VWHGl89sOJJ09KtWVr2WuwhO5PkGvfrgV1sS2B/DV6lW5/eWlaoXpoFoPvVd8VyabspdF3JUPPujumopmRR5cb3jXH1VxKC+cnX+B9k9dVGigvnJ1/gfZPXVSmR64K8tYPYr/ib7owdD++XeT3DlekZpj+YHxExP3MlehXS4Oh/fLvJ7hyvSM0x/MD4iYn7mSvQrpyc1QSR3HaceShLba3FbAOyhJUeLmFSrAFouEjHeGWmoEtbhucUhKWF8jqSeTmBNeDA+LrjgXElpxDanNmbAWlxKSdEuJ00UhX6Kk6g9umjYNxbb8cYYtuILU4Vwrg0HEgnqkHiUhX6SSCk9qofpbpHHsWG0iBfY8EXr1KHcRQ7MRjjimMhKNmCelQjYu6ffK7Z89UT4ZtumOZoW6QiJIWw5aWkpcS0pSVEOOajUDjGo8Iq9dZru4/LVK6OW2bFnRNhl/AilaZ99CpFNy3OIfJ1olE9KlQVof6XIjuJPUubKmyD2FbqOGVXC7zKyxksNOXd3EFkQQF267OF3qeZt46rQebeR+ia8PCWzZ90rHC4kB8rw7ZFKjxNk9S+5ro493yNB+iBz0Fa+j7OjxpmWZGmIdxzhW7WtK99BjTPDDJRCK1rHlrTUDanQ5M52YZzuwx7MWB5SJDBCJtvfID8RwjiUBxpO/RQ3EDnBAgXCxyAj5y4GdnW2MkYxsjSnYDqRoqQgalUdR5Qrfs68StOQnVdGQWbU3JvMy04hZdWLapaY1zYB3PRVEBeo5Sn347Keyacuy6iQyh1tYW2tIUlQ3gg7wa68lrSI4UyRbJrMqOtTUlhYUkkaFJHIR5CKsnh69NYgs8W4NAAPJ6pAPvFjcpPeNQ/hZYGawFnzimHFbDcG4LRdI6QNAEvgqUAOYOBwVycmrsdu42paupIEhsc3zVerXHPQr0O+Mwp/q9td0raHM3HoRfRwyPHLyXpzow+mXZ2Lu0n+mhqDbhHK2o7vArT9o0C6trfLcm7WafBWNRIZWgdsjcfDpVU/wKV/0V+CsJGJVhadi26xbM5C0GzMMYRBj4twPpRW7oL5ydf4H2T11UaKC+cnX+B9k9dVcsj1wU51g9iv8Aib7owdD++XeT3DlekZpj+YHxExP3MlehXS4Oh/fLvJ7hyvSM0x/MD4iYn7mSvQrpyc1QSRw38Gj6o81WY4IubPtZxIvBtzf2bVenNqIpZ3MS9NNOwHANPrBPPVZ2/g0fVHmr9G3FtLS42tSHEEKStJ0KSN4IPIQaX2tZkK1JN8nGycM9x2HgVugRnQIgiN2JvlV/4VWbPtFwd7Xra/sX6/oU3tIOio8bicX2Cr3g/WPJXXygz1tuKcppWJL9LQzOw8zsXfnJSOpcA/xBpoPytRVEsxMcz8xsY3PEVx1S5LX/AETOuoYaG5DY7AHhOp5ap/RDRGLEtV/PW9GAcdxdsHeP1eFN6fz8+0QByZxd7KL8XarKysq8lGlojVJHONKdZkfcXbtk3gKa/qXnrJCUsnjJ6SkE+SkuW+3SrvOjW+Cyt6bMdTHYaQNVLcWdlIHbJFPCwPh1OEcGYfsCSki1QGIe0niPS20pJ8IrwoS+eiLRG280sLSkgBx6ylC9OM7D69P9RqtWWMgsYzhAHc6lxs99JPnAo88P/ETd3zxj25pQPsLaWI7gHI44pbpH7KkeGgBlw2XMaWvQe9UtR7QQqtcbqneCbWA5zbUli3O+3/IKwo3Gop7Tov5J8FSuvH7Is/lJ8NIWEjJfRVoy0tHu84AwrSvBeygvnJ1/gfZPXVRooL5ydf4H2T11V0SPXBRzWD2K/wCJvujB0P75d5PcOV6RmmP5gfETE/cyV6FdLg6H98u8nuHK9IzTKcXW5+7YVvkCKkKky4T7DSVHQFam1JAJ5N5FOTmqCSLm/g0fVHmr6qxiOAvnMlCR7C2vcAOujVb/ABGM5voW1/5o1XtUKvTM+VHiyorMh1uNLCQ+0lZCXQlW0naHLod415a89WN/EYzm+hbX/mjVfsxwE843VBK7bZ2QfnLuaCB+yDQKDJCrZWAEkAbyTpVz8LdDoxbNcbViPFtntrJ3qRAaclODsaqCE+erS5S8ErLnKZ9i4Rbc5d781oU3K6kOrbVztoACEHsgbXZoqhAngacFadZrhDzHxtDXFlNJ27Ra30aONkjT8IdSfenQnYSd412jodKudjHFdswNha7YivL4YtlrjqkPL5dlI4hzknQAcpIFe68Xm3Yetcq53WbHhW6IguPyZDgQ22kcqlHcKV9wr+FC5nPcU4ew4p5jBMB3bClgoXcXRro6pPIgfNSd/wA479APM0IEY8xhNzAxpfcUXHdMu8tclSddQ2CepQOwlISnvVIsnrcX79LmkdRFY2Qf0lnTzA0O+OrC5f4dOHcPNNvJ2Zck9Oe5wTxJ7w8utc05EDIRG9TTQOy3Ttqsi06MLpHx/SPPHgVJZD6Isd19w6NsoK1HmAGp81Vv90CbRdzVvgs+EpDSVaSJ5/B0Dl0O9R8G7v1XPXsCuaShAtLnKQaw7aiQ5yHKy7qFoqab3bPIV4q4dBfOTr/A+yeuqjM2tLraVoIKFAKBHKDQnzltrvTrbcUpJZ2FR1kfNOu0PDv8FaJI0jCqlmnkN0WxIhYK0LTwqpPwOswrLlznbBnX+U3DttwhvW9Ut06NsLWUKQpZ5EkthJJ3Da1O6mvs3q2yGkOtT4jjSxtJWh5JChzgg0iWsAAGgGg7FOiF8/p7vsrB/PI/jU/zrPZWD+eR/Gp/nSIqyiiE932Vg/nkfxqf51+T19tcdJU9cYbaRyrfQB5TSJ60UpVxpB7Y1oohOrxDnhlxhVpTl2xxh+Ns/M/Dm1uHtISSo+Cq/wCYPRBcD2Np5jCFtn4jmgEIecQYkUHkO0sbZ7ye/S1EpCfegDtDSt0UQifm5wgMcZ0ywrElz2ba2vbYtUMFuK0eQ7OpK1b/AHyyTzaUMK9MC3S7pIEeFHdkPH5jadT3+bv0WMIZVtw1ImXvYeeGikxU70JP6R+cexxdutUWOyEOkU7sbR6dteJclmdHa4/lHH6DFcvLTAy5TzV6uLWkds7UZpQ+EVyLI/JHJznymAqCQVEgAbySdwrYGgAA3cQAoP5pZhoLb1htTu0T1Mp9B3AcraT5z3uelJL5qJ94K52tkND7LONT6vd/r2HrC8x8VjFF/WphesCKC0x+lzr758gFQ+tkjdoNK1TdjAxoaFQ89ORZ2YfMxjVzjU/e4ZBWHypxQi+Yebgur/r1vSG1Anepv5qv4d7s1M7jbo11hPQ5jSXY7o0Uk+fsHs1VSzXebYrg1OgPFqQ1vB5COUEcoPNR3wtmvZ720hqe4i3zuIpcP9Go86VcnaPlpZMyzmuvsyVv6JaWyk3KNs+0XAPAu9LJwy24VpgQc1Hrpk3KS8pVsuDS2SdyJIKVDvgEHwCuf7j99/OIHjFfdo2NOtvIC2lpWg8SkkEHvivusBOxhhVNImgNiRXGI1pAO5xpwzQQ9x++/nEDxivu1nuP3384geMV92jfWV7z6KsP4eWNud83/EEPcfvv5xA8Yr7tfScnr4eOVAT+uo+rRtrKOfRUDV5Y253zIQRsmJalD8JurCE8vSmlKPlIqRW3KSxwyFSlyJqhyOK2EnvJ/nU2fmRoqSp+Qy0kcriwnz1HbjmNhm2pV0y6tOrHzI4LhPg3eWvOcTETAHyWxujmjVmdOM1gp/W6voTT0XfgW6Ja2AxCjNR2h81pASP/ANr6mzo1ujOSZb7bEdsaqccVoBQlvWdxKVos9v05A9KVv7yAf40MbziG6YikdOuMxx9Q96lR0SntJG4VlDk3vNX4JfaesCzpJnJWe3lCMqCjR99w4ogY4zZcuKHbfYytmKrqXJR6lbg5kj5o8p7FCw6anQ6jnrVbI0JHNTKHCbDFGqo7VteatWOY826p2DYBuA2fdVh03aGtVsjTTs1qtiWr/9k=";
  global.BD_OFFICIAL_LOGO_URI = OFFICIAL_LOGO_DATA_URI;

  var LABEL_MAP = [
    { m: "women",           icon: "womensClothing" },
    { m: "home & garden",   icon: "homeGarden" },
    { m: "home, garden",    icon: "homeGarden" },
    { m: "garden",          icon: "homeGarden" },
    { m: "pet",             icon: "pets" },
    { m: "sale",            icon: "sale" },
    { m: "bargain",         icon: "sale" },
    { m: "all products",    icon: "sale" },
    { m: "home",            icon: "home" },
    { m: "categor",         icon: "categories" },
    { m: "wishlist",        icon: "wishlist" },
    { m: "cart",            icon: "cart" },
    { m: "checkout",        icon: "cart" },
    { m: "order",           icon: "orders" },
    { m: "account",         icon: "account" },
    { m: "profile",         icon: "profileInfo" },
    { m: "address",         icon: "addresses" },
    { m: "payment",         icon: "payment" },
    { m: "card",            icon: "payment" },
    { m: "return",          icon: "returns" },
    { m: "wallet",          icon: "wallet" },
    { m: "gift",            icon: "gift" },
    { m: "sign out",        icon: "signOut" },
    { m: "log out",         icon: "signOut" },
    { m: "logout",          icon: "signOut" },
    { m: "sign in",         icon: "signIn" },
    { m: "create account",  icon: "register" },
    { m: "register",        icon: "register" },
    { m: "service",         icon: "support" },
    { m: "support",         icon: "support" },
    { m: "ticket",          icon: "support" },
    { m: "privacy",         icon: "privacy" },
    { m: "policy",          icon: "privacy" },
    { m: "setting",         icon: "settings" },
    { m: "security",        icon: "security" },
    { m: "notif",           icon: "notifications" },
    { m: "logo",            icon: "sale" },
    { m: "deactivat",       icon: "returns" }
  ];

  function labelOf(item) {
    return (item.textContent || "").replace(/[0-9]+/g, "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function findMatch(label) {
    for (var i = 0; i < LABEL_MAP.length; i++) {
      if (label.indexOf(LABEL_MAP[i].m) >= 0) return LABEL_MAP[i];
    }
    return null;
  }

  function injectSlideMenuCSS() {
    try {
      if (document.getElementById("bd-slide-menu-core-css")) return;
      var st = document.createElement("style");
      st.id = "bd-slide-menu-core-css";
      st.textContent =
        ".navbar,.nb,header.navbar{display:flex!important;align-items:center!important;justify-content:space-between!important;min-height:54px!important;width:100%!important;max-width:100vw!important;box-sizing:border-box!important;padding:0 6px!important;gap:2px!important;overflow:visible!important;}" +
        ".nav-logo,.nlogo{display:inline-flex!important;align-items:center!important;gap:4px!important;min-width:0!important;flex-shrink:1!important;margin-right:auto!important;text-decoration:none!important;}" +
        ".nav-logo img,.nlogo img,.nav-logo .logo-svg,.nav-logo .logo-icon{width:25px!important;height:25px!important;min-width:25px!important;border-radius:6px!important;object-fit:contain!important;flex-shrink:0!important;display:block!important;}" +
        ".nav-logo .logo-text,.nlogo .lt{font-size:0.70rem!important;font-weight:900!important;letter-spacing:-0.4px!important;display:inline-flex!important;align-items:center!important;gap:3px!important;white-space:nowrap!important;line-height:1!important;}" +
        ".nav-search-wrap{flex:0 1 auto!important;margin:0 2px!important;max-width:28px!important;}" +
        ".nav-search-wrap:has(.nav-search.expanded){flex:1 1 auto!important;max-width:170px!important;}" +
        ".nav-search{max-width:28px!important;height:28px!important;padding:0 6px!important;}" +
        ".nav-search.expanded{max-width:170px!important;padding:0 10px!important;}" +
        ".nav-actions,.nact,.na,.nav-right{display:flex!important;align-items:center!important;gap:2px!important;flex-shrink:0!important;margin-left:0!important;}" +
        ".nav-btn,.nbtn,.hamburger-btn{width:28px!important;height:28px!important;min-width:28px!important;max-width:28px!important;padding:0!important;margin:0!important;margin-left:0!important;flex-shrink:0!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;border-radius:7px!important;cursor:pointer!important;visibility:visible!important;opacity:1!important;position:relative!important;box-sizing:border-box!important;}" +
        ".nav-btn svg,.nbtn svg,.hamburger-btn svg{width:15px!important;height:15px!important;display:block!important;pointer-events:none!important;flex-shrink:0!important;}" +
        ".nav-badge,.badge,.bdg{position:absolute!important;top:-3px!important;right:-3px!important;min-width:14px!important;height:14px!important;font-size:0.5rem!important;padding:0 3px!important;border-radius:999px!important;line-height:14px!important;z-index:2!important;}" +
        ".hamburger-btn{background:#111827!important;border:1px solid #DC2626!important;color:#FACC15!important;font-size:1.05rem!important;}" +
        ".hamburger-btn:hover{background:#DC2626!important;color:#ffffff!important;}" +
        "@media(min-width:400px){.navbar,.nb,header.navbar{padding:0 10px!important;}.nav-logo img,.nlogo img,.nav-logo .logo-svg{width:29px!important;height:29px!important;min-width:29px!important;}.nav-logo .logo-text,.nlogo .lt{font-size:0.82rem!important;gap:4px!important;}.nav-btn,.nbtn,.hamburger-btn{width:32px!important;height:32px!important;min-width:32px!important;max-width:32px!important;}.nav-btn svg,.nbtn svg,.hamburger-btn svg{width:16px!important;height:16px!important;}}" +
        "@media(min-width:640px){.navbar,.nb,header.navbar{padding:0 16px!important;}.nav-logo img,.nlogo img,.nav-logo .logo-svg{width:34px!important;height:34px!important;min-width:34px!important;}.nav-logo .logo-text,.nlogo .lt{font-size:1.02rem!important;gap:5px!important;}.nav-search-wrap{max-width:280px!important;margin:0 8px!important;}.nav-search{max-width:36px!important;height:36px!important;}.nav-search.expanded{max-width:280px!important;}.nav-actions,.nact,.na,.nav-right{gap:6px!important;}.nav-btn,.nbtn,.hamburger-btn{width:36px!important;height:36px!important;min-width:36px!important;max-width:36px!important;}.nav-btn svg,.nbtn svg,.hamburger-btn svg{width:18px!important;height:18px!important;}}" +
        ".slide-menu{position:fixed!important;top:0!important;left:0!important;right:0!important;bottom:0!important;z-index:9999!important;pointer-events:none!important;display:none!important;}" +
        ".slide-menu.open{pointer-events:auto!important;display:block!important;}" +
        ".slide-backdrop{position:absolute!important;top:0!important;left:0!important;right:0!important;bottom:0!important;background:rgba(0,0,0,0.68)!important;opacity:0!important;transition:opacity .25s ease!important;}" +
        ".slide-menu.open .slide-backdrop{opacity:1!important;}" +
        ".slide-panel{position:absolute!important;top:0!important;right:0!important;width:290px!important;max-width:86vw!important;height:100%!important;background:#08090a!important;color:#ffffff!important;padding:64px 0 28px!important;transform:translateX(100%)!important;transition:transform .25s ease!important;overflow-y:auto!important;box-shadow:-10px 0 32px rgba(0,0,0,0.85)!important;border-left:1px solid #DC2626!important;}" +
        ".slide-menu.open .slide-panel{transform:translateX(0)!important;}" +
        ".slide-item{display:flex!important;align-items:center!important;gap:12px!important;padding:12px 20px!important;font-size:.85rem!important;color:#f8fafc!important;text-decoration:none!important;font-weight:700!important;border-bottom:1px solid #1e232a!important;transition:all .15s ease!important;}" +
        ".slide-item:hover{background:#111827!important;color:#FACC15!important;padding-left:24px!important;}" +
        ".slide-ico,.mi-icon{width:34px!important;height:34px!important;border-radius:8px!important;background:#111827!important;border:1px solid rgba(220,38,38,0.45)!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;flex-shrink:0!important;box-shadow:inset 0 1px 0 rgba(250,204,21,0.12),0 2px 6px rgba(0,0,0,0.45)!important;color:transparent!important;font-size:0!important;}" +
        ".slide-item:hover .slide-ico,.mi:hover .mi-icon{border-color:#FACC15!important;box-shadow:0 0 10px rgba(250,204,21,0.25)!important;}" +
        ".slide-heading{font-size:.65rem!important;font-weight:900!important;color:#FACC15!important;text-transform:uppercase!important;letter-spacing:.1em!important;padding:14px 20px 6px!important;}" +
        ".slide-divider{height:1px!important;background:#222425!important;margin:6px 0!important;}" +
        ".slide-close{position:absolute!important;top:14px!important;right:14px!important;width:34px!important;height:34px!important;border-radius:8px!important;border:1px solid #DC2626!important;background:#111827!important;font-size:1.25rem!important;cursor:pointer!important;color:#FACC15!important;display:flex!important;align-items:center!important;justify-content:center!important;z-index:10!important;transition:all .15s ease!important;}" +
        ".slide-close:hover{background:#DC2626!important;color:#ffffff!important;}";
      (document.head || document.documentElement).appendChild(st);
    } catch (e) {}
  }

  function ensureOfficialLogo() {
    try {
      // 1. Replace any <img src*="official-logo.jpg"> with embedded data URI so it never fails to load
      var imgs = document.querySelectorAll("img");
      for (var i = 0; i < imgs.length; i++) {
        var src = imgs[i].getAttribute("src") || "";
        if (src.indexOf("official-logo.jpg") >= 0) {
          imgs[i].src = OFFICIAL_LOGO_DATA_URI;
        }
      }
      // 2. Ensure every .nav-logo / .nlogo has a working logo image & BARGAIN DROP text
      var savedOpt = "opt_official";
      try { savedOpt = localStorage.getItem("bd_selected_logo") || "opt_official"; } catch (e) {}
      if (savedOpt === "opt_official") {
        var logos = document.querySelectorAll(".nav-logo, .nlogo");
        for (var j = 0; j < logos.length; j++) {
          var lg = logos[j];
          var lgImg = lg.querySelector("img");
          if (lgImg) {
            if ((lgImg.getAttribute("src") || "").indexOf("data:image/") !== 0) {
              lgImg.src = OFFICIAL_LOGO_DATA_URI;
            }
          } else if (!lg.querySelector("svg")) {
            lg.innerHTML =
              "<img src=\"" + OFFICIAL_LOGO_DATA_URI + "\" alt=\"Bargain Drop Logo\" style=\"width:28px;height:28px;object-fit:contain;border-radius:6px;flex-shrink:0;border:1.5px solid #0a0a0a;background:#0a0a0a;\" />" +
              "<div class=\"logo-text\"><span style=\"color:#ff1a3c!important;font-weight:900;\">BARGAIN</span> <span style=\"color:#ffffff!important;font-weight:900;\">DROP</span></div>";
          }
        }
      }
    } catch (e) {}
  }

  function ensureNavbarIcons() {
    try {
      var navbars = document.querySelectorAll(".navbar, .nb, header.navbar");
      for (var n = 0; n < navbars.length; n++) {
        var nav = navbars[n];
        var act = nav.querySelector(".nav-actions, .nact, .na, .nav-right");
        if (!act) {
          act = document.createElement("div");
          act.className = "nav-actions";
          nav.appendChild(act);
        }

        // Unhide ALL buttons inside .nav-actions (fixes notifications.js hiding bell or inline display:none)
        var children = act.querySelectorAll("a, button");
        for (var c = 0; c < children.length; c++) {
          var btn = children[c];
          if (btn.style && btn.style.display === "none") {
            btn.style.display = "inline-flex";
          }
          btn.style.marginLeft = "0px";
          if (!btn.classList.contains("nav-btn") && !btn.classList.contains("nbtn")) {
            btn.classList.add("nav-btn");
          }
          var bdg = btn.querySelector(".nav-badge, .badge, .bdg");
          if (bdg && bdg.style) {
            bdg.style.position = "absolute";
          }
        }

        // Ensure Notification Bell button exists for signed-in and guest users if missing
        var hasBell = act.querySelector("[aria-label=\"Notifications\"], [href*=\"notification\"]");
        var existingHamburger = act.querySelector(".hamburger-btn, [aria-label=\"Open menu\"], [aria-label=\"Menu\"], [onclick*=\"slide-menu\"]");
        if (!hasBell) {
          var bellLink = document.createElement("a");
          bellLink.href = "notification-center.html";
          bellLink.className = "nav-btn";
          bellLink.setAttribute("aria-label", "Notifications");
          bellLink.innerHTML =
            (global.BDIcon && global.BDIcon.svg ? global.BDIcon.svg("notifications", { size: 16 }) : "<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\"><path d=\"M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9\"/><path d=\"M13.73 21a2 2 0 0 1-3.46 0\"/></svg>") +
            "<span class=\"nav-badge\" id=\"nav-notif-count\" style=\"display:none;position:absolute\">0</span>";
          if (existingHamburger) {
            act.insertBefore(bellLink, existingHamburger);
          } else {
            act.appendChild(bellLink);
          }
        }

        // Ensure Profile / Account icon button exists in .nav-actions on mobile & desktop
        var hasProfileBtn = act.querySelector("[aria-label=\"Account\"], [aria-label=\"Profile\"], [href=\"profile.html\"]");
        if (!hasProfileBtn) {
          var profLink = document.createElement("a");
          profLink.href = "profile.html";
          profLink.className = "nav-btn";
          profLink.setAttribute("aria-label", "Account");
          profLink.innerHTML =
            global.BDIcon && global.BDIcon.svg
              ? global.BDIcon.svg("account", { size: 16 })
              : "<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\"><circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M4 20c0-4 4-6 8-6s8 2 8 6\"/></svg>";
          if (existingHamburger) {
            act.insertBefore(profLink, existingHamburger);
          } else {
            act.appendChild(profLink);
          }
        }

        // Ensure Hamburger Menu button exists at the end of .nav-actions
        if (!existingHamburger) {
          var hBtn = document.createElement("button");
          hBtn.className = "nav-btn hamburger-btn";
          hBtn.setAttribute("aria-label", "Open menu");
          hBtn.setAttribute("onclick", "document.getElementById('slide-menu').classList.toggle('open')");
          if (global.BDIcon && global.BDIcon.svg) {
            hBtn.innerHTML = global.BDIcon.svg("menu", { size: 17 });
            hBtn.setAttribute("data-bd-iconified", "menu");
          } else {
            hBtn.innerHTML = "&#9776;";
          }
          act.appendChild(hBtn);
        } else {
          existingHamburger.classList.add("nav-btn", "hamburger-btn");
          existingHamburger.style.display = "inline-flex";
          if (global.BDIcon && global.BDIcon.svg && !existingHamburger.querySelector("svg")) {
            existingHamburger.innerHTML = global.BDIcon.svg("menu", { size: 17 });
            existingHamburger.setAttribute("data-bd-iconified", "menu");
          }
        }

        // Ensure every button in .nav-actions has a crisp SVG icon
        if (global.BDIcon && global.BDIcon.svg) {
          var allBtns = act.querySelectorAll("a, button");
          for (var k = 0; k < allBtns.length; k++) {
            var b = allBtns[k];
            if (b.querySelector("svg")) continue;
            var aria = ((b.getAttribute("aria-label") || "") + " " + (b.getAttribute("href") || "")).toLowerCase();
            var ic = null;
            if (aria.indexOf("search") >= 0 || aria.indexOf("products") >= 0) ic = "search";
            else if (aria.indexOf("wish") >= 0) ic = "wishlist";
            else if (aria.indexOf("cart") >= 0) ic = "cart";
            else if (aria.indexOf("notif") >= 0) ic = "notifications";
            else if (aria.indexOf("menu") >= 0 || b.classList.contains("hamburger-btn")) ic = "menu";
            else if (aria.indexOf("profile") >= 0 || aria.indexOf("account") >= 0) ic = "account";
            if (ic) {
              var badge = b.querySelector(".nav-badge, .badge, .bdg");
              var badgeHtml = badge ? badge.outerHTML : "";
              b.innerHTML = global.BDIcon.svg(ic, { size: 16 }) + badgeHtml;
              b.setAttribute("data-bd-iconified", ic);
            }
          }
        }
      }
    } catch (e) {}
  }

  function ensureSlideMenuDOM() {
    try {
      ensureOfficialLogo();
      ensureNavbarIcons();

      var sm = document.getElementById("slide-menu");
      if (!sm) {
        sm = document.createElement("div");
        sm.className = "slide-menu";
        sm.id = "slide-menu";
        sm.innerHTML =
          "<div class=\"slide-backdrop\" onclick=\"document.getElementById('slide-menu').classList.remove('open')\"></div>" +
          "<div class=\"slide-panel\"></div>";
        document.body.appendChild(sm);
      } else if (!sm.querySelector(".slide-panel")) {
        sm.innerHTML =
          "<div class=\"slide-backdrop\" onclick=\"document.getElementById('slide-menu').classList.remove('open')\"></div>" +
          "<div class=\"slide-panel\"></div>";
      }

      var panel = sm.querySelector(".slide-panel");
      if (panel && !panel.getAttribute("data-matrix-upgraded")) {
        panel.setAttribute("data-matrix-upgraded", "1");
        var creditEl = panel.querySelector("#slide-credit");
        var creditHtml = creditEl ? creditEl.outerHTML : "";
        panel.innerHTML =
          creditHtml +
          "<button class=\"slide-close\" onclick=\"document.getElementById('slide-menu').classList.remove('open')\" aria-label=\"Close menu\">&times;</button>" +
          "<div class=\"slide-heading\">Shop</div>" +
          "<a href=\"/\" class=\"slide-item\"><span class=\"slide-ico\"></span>Home</a>" +
          "<a href=\"category.html?cat=womens-clothing&name=Women's%20Clothing\" class=\"slide-item\"><span class=\"slide-ico\"></span>Women's Clothing</a>" +
          "<a href=\"category.html?cat=home-garden-furniture&name=Home%2C%20Garden%20%26%20Furniture\" class=\"slide-item\"><span class=\"slide-ico\"></span>Home &amp; Garden</a>" +
          "<a href=\"category.html?cat=pet-supplies&name=Pet%20Supplies\" class=\"slide-item\"><span class=\"slide-ico\"></span>Pet Supplies</a>" +
          "<a href=\"products.html\" class=\"slide-item\"><span class=\"slide-ico\"></span>Sale &amp; Bargains</a>" +
          "<a href=\"category.html\" class=\"slide-item\"><span class=\"slide-ico\"></span>All Categories</a>" +
          "<a href=\"wishlist.html\" class=\"slide-item\"><span class=\"slide-ico\"></span>Wishlist</a>" +
          "<a href=\"cart.html\" class=\"slide-item\"><span class=\"slide-ico\"></span>Cart</a>" +
          "<div class=\"slide-divider\"></div>" +
          "<div class=\"slide-heading\">Account</div>" +
          "<div id=\"slide-auth-items\"></div>" +
          "<div id=\"slide-guest-items\"></div>" +
          "<div class=\"slide-divider\"></div>" +
          "<div class=\"slide-heading\">Support &amp; Admin</div>" +
          "<a href=\"customer-service.html\" class=\"slide-item\"><span class=\"slide-ico\"></span>Customer Support</a>" +
          "<a href=\"policy.html\" class=\"slide-item\"><span class=\"slide-ico\"></span>Privacy Policy</a>" +
          "<a href=\"admin-orders.html\" class=\"slide-item\"><span class=\"slide-ico\"></span>Store Orders (PIN)</a>";
      }

      var A = document.getElementById("slide-auth-items") || document.getElementById("bd-slide-auth");
      var G = document.getElementById("slide-guest-items") || document.getElementById("bd-slide-guest");
      if (A && G) {
        var sess = null;
        try { sess = JSON.parse(localStorage.getItem("bd_session") || "null"); } catch (e) {}
        var signedIn = !!(sess && sess.email) || !!localStorage.getItem("bd_user_email");
        function mi(href, label) {
          return "<a href=\"" + href + "\" class=\"slide-item\"><span class=\"slide-ico\"></span>" + label + "</a>";
        }
        var owned = [
          ["profile.html", "User Profile Settings"],
          ["orders.html", "Order History"],
          ["addresses.html", "Saved Address Book"],
          ["payment-methods.html", "Saved Cards & Wallet"],
          ["wallet.html", "Store Credit & Wallet"],
          ["returns.html", "Returns & Exchanges"],
          ["gift-cards.html", "Gift Cards"],
          ["admin-orders.html", "Admin Orders (PIN)"]
        ];
        if (signedIn) {
          A.style.display = "";
          A.innerHTML = owned.map(function (o) { return mi(o[0], o[1]); }).join("") +
            "<a href=\"#\" class=\"slide-item\" id=\"bd-slide-signout-link\"><span class=\"slide-ico\"></span>Logout / Sign Out</a>";
          G.style.display = "none";
          G.innerHTML = "";
          var so = document.getElementById("bd-slide-signout-link");
          if (so) {
            so.onclick = function (e) {
              e.preventDefault();
              var ks = [];
              for (var i = 0; i < localStorage.length; i++) ks.push(localStorage.key(i));
              ks.forEach(function (k) {
                if (k.indexOf("bd_") === 0 && k !== "bd_cart") localStorage.removeItem(k);
              });
              fetch("/api/auth", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "signout" })
              }).catch(function () {});
              location.href = "/";
            };
          }
        } else {
          A.style.display = "none";
          A.innerHTML = "";
          G.style.display = "";
          G.innerHTML = mi("sign-in.html", "Sign In") + mi("register.html", "Create Account");
        }
      }
    } catch (e) {}
  }

  function svgIconsOnly() {
    if (!(global.BDIcon && global.BDIcon.svg)) return;
    // 1. Iconify Slide-Out Menu items
    var items = document.querySelectorAll(".slide-item");
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var ico = item.querySelector(".slide-ico");
      if (!ico) continue;
      if (ico.querySelector("svg")) continue;
      var label = labelOf(item);
      var m = findMatch(label);
      var name = m ? m.icon : "categories";
      ico.innerHTML = global.BDIcon.svg(name, { size: 20 });
      ico.setAttribute("data-ic", name);
      ico.removeAttribute("style");
    }

    // 2. Iconify Customer Profile Dashboard items (.mi .mi-icon)
    var profileRows = document.querySelectorAll(".mi");
    for (var j = 0; j < profileRows.length; j++) {
      var row = profileRows[j];
      var mIcon = row.querySelector(".mi-icon");
      if (!mIcon) continue;
      if (mIcon.querySelector("svg")) continue;
      var rowLabel = labelOf(row);
      var match = findMatch(rowLabel);
      var iconKey = match ? match.icon : "account";
      mIcon.innerHTML = global.BDIcon.svg(iconKey, { size: 20 });
      mIcon.setAttribute("data-ic", iconKey);
      mIcon.removeAttribute("style");
    }
  }

  function iconify() {
    injectSlideMenuCSS();
    ensureSlideMenuDOM();
    svgIconsOnly();
  }

  global.BDIconifySlide = {
    iconify: iconify,
    svgIconsOnly: svgIconsOnly,
    ensureNavbarIcons: ensureNavbarIcons,
    ensureOfficialLogo: ensureOfficialLogo
  };

  if (typeof document !== "undefined") {
    injectSlideMenuCSS();
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        var sm = document.getElementById("slide-menu");
        if (sm) sm.classList.remove("open");
      }
    });
    function startEngine() {
      iconify();
      // Re-verify after async auth checks (e.g. /api/auth?action=me) resolve
      setTimeout(iconify, 350);
      setTimeout(iconify, 1100);
      try {
        var obs = new MutationObserver(function () {
          ensureOfficialLogo();
          ensureNavbarIcons();
          svgIconsOnly();
        });
        obs.observe(document.body, { childList: true, subtree: true });
      } catch (e) {}
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", startEngine);
    } else {
      startEngine();
    }
  }
})(typeof globalThis !== "undefined" ? globalThis : this);