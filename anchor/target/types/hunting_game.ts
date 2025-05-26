/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/hunting_game.json`.
 */
export type HuntingGame = {
  "address": "4td2N7STVV1zEyrPBbf6bEhq5LW7GkTT7kpNwt762nMW",
  "metadata": {
    "name": "huntingGame",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "A game"
  },
  "instructions": [
    {
      "name": "breedBear",
      "discriminator": [
        21,
        166,
        112,
        81,
        89,
        167,
        63,
        43
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "gameState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "userBearBalance",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  98,
                  101,
                  97,
                  114,
                  95,
                  98,
                  97,
                  108,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "signer"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "buyBear",
      "discriminator": [
        110,
        148,
        42,
        182,
        190,
        227,
        150,
        237
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "gameState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "gameVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "userBearBalance",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  98,
                  101,
                  97,
                  114,
                  95,
                  98,
                  97,
                  108,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "signer"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "paidSolAmount",
          "type": "u64"
        },
        {
          "name": "minReceivedBearAmount",
          "type": "u64"
        },
        {
          "name": "stake",
          "type": "bool"
        }
      ]
    },
    {
      "name": "enterIsland",
      "discriminator": [
        177,
        165,
        54,
        19,
        120,
        129,
        128,
        205
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "userBearBalance",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  98,
                  101,
                  97,
                  114,
                  95,
                  98,
                  97,
                  108,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "signer"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "exitIsland",
      "discriminator": [
        220,
        10,
        91,
        37,
        65,
        109,
        109,
        111
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "gameState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "gameVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "userBearBalance",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  98,
                  101,
                  97,
                  114,
                  95,
                  98,
                  97,
                  108,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "signer"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "hunt",
      "discriminator": [
        148,
        30,
        28,
        57,
        49,
        249,
        29,
        65
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "gameState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "hunterMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  117,
                  110,
                  116,
                  101,
                  114,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "hunterId"
              }
            ]
          }
        },
        {
          "name": "hunterMintTokenAccount",
          "writable": true
        },
        {
          "name": "hunter",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  117,
                  110,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "hunterMint"
              }
            ]
          }
        },
        {
          "name": "userBearBalance",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  98,
                  101,
                  97,
                  114,
                  95,
                  98,
                  97,
                  108,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "hunterBearBalance",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  98,
                  101,
                  97,
                  114,
                  95,
                  98,
                  97,
                  108,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "signer"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "user",
          "type": "pubkey"
        },
        {
          "name": "hunterId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true,
          "address": "88be4vXQGw9za3YCukkdLJSNhyvsnTMbgFWttevBfShf"
        },
        {
          "name": "gameState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "gameVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "hunterCollectionMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  117,
                  110,
                  116,
                  101,
                  114,
                  95,
                  99,
                  111,
                  108,
                  108,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "hunterCollectionTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "admin"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "hunterCollectionMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeBearPool",
      "discriminator": [
        55,
        154,
        93,
        203,
        130,
        106,
        83,
        88
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true,
          "address": "88be4vXQGw9za3YCukkdLJSNhyvsnTMbgFWttevBfShf"
        },
        {
          "name": "gameState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "gameVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeBearPoolForTest",
      "discriminator": [
        181,
        29,
        52,
        97,
        151,
        205,
        187,
        199
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true,
          "address": "88be4vXQGw9za3YCukkdLJSNhyvsnTMbgFWttevBfShf"
        },
        {
          "name": "gameState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "gameVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "mintHunter",
      "discriminator": [
        161,
        17,
        69,
        37,
        152,
        30,
        150,
        82
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "gameState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "gameVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "hunterMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  117,
                  110,
                  116,
                  101,
                  114,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "game_state.hunters_minted.checked_add(1)",
                "account": "gameState"
              }
            ]
          }
        },
        {
          "name": "hunterMintTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "signer"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "hunterMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "hunter",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  117,
                  110,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "hunterMint"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "mintHunter2",
      "discriminator": [
        185,
        139,
        154,
        79,
        156,
        110,
        58,
        91
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "gameState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "gameVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "hunterMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  117,
                  110,
                  116,
                  101,
                  114,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "game_state.hunters_minted.checked_add(1)",
                "account": "gameState"
              }
            ]
          }
        },
        {
          "name": "hunterMintTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "signer"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "hunterMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "hunter",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  117,
                  110,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "hunterMint"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "requestExitIsland",
      "discriminator": [
        160,
        143,
        37,
        140,
        89,
        106,
        145,
        163
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "userBearBalance",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  98,
                  101,
                  97,
                  114,
                  95,
                  98,
                  97,
                  108,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "signer"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "sellBear",
      "discriminator": [
        245,
        75,
        165,
        160,
        46,
        117,
        184,
        11
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "gameState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "gameVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "sellerBearBalance",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  98,
                  101,
                  97,
                  114,
                  95,
                  98,
                  97,
                  108,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "signer"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "sendBearAmount",
          "type": "u64"
        },
        {
          "name": "minReceivedSolAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setRequestExitIslandTimestamp",
      "discriminator": [
        250,
        29,
        169,
        87,
        157,
        181,
        245,
        156
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "userBearBalance",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  98,
                  101,
                  97,
                  114,
                  95,
                  98,
                  97,
                  108,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "signer"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "timestamp",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setTimestampForTest",
      "discriminator": [
        228,
        90,
        153,
        230,
        79,
        193,
        133,
        69
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "gameState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "userBearBalance",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  98,
                  101,
                  97,
                  114,
                  95,
                  98,
                  97,
                  108,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "signer"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "timestamp",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "gameState",
      "discriminator": [
        144,
        94,
        208,
        172,
        248,
        99,
        134,
        120
      ]
    },
    {
      "name": "hunter",
      "discriminator": [
        165,
        223,
        74,
        51,
        233,
        78,
        81,
        220
      ]
    },
    {
      "name": "userBearBalance",
      "discriminator": [
        141,
        255,
        39,
        8,
        132,
        25,
        45,
        166
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidOwner",
      "msg": "Invalid owner"
    },
    {
      "code": 6001,
      "name": "gameAlreadyInitialized",
      "msg": "Game state already initialized"
    },
    {
      "code": 6002,
      "name": "bearPoolAlreadyInitialized",
      "msg": "Bear liquidity pool is already initialized"
    },
    {
      "code": 6003,
      "name": "hunterAlreadyMinted",
      "msg": "This hunter is already minted"
    },
    {
      "code": 6004,
      "name": "mintingPhase1Ended",
      "msg": "Minting phase 1 is ended"
    },
    {
      "code": 6005,
      "name": "mintingPhase1NotEnded",
      "msg": "Minting phase 1 is not ended"
    },
    {
      "code": 6006,
      "name": "noPermission",
      "msg": "No permission to access this account"
    },
    {
      "code": 6007,
      "name": "invalidHunterMint",
      "msg": "Invaid hunter mint"
    },
    {
      "code": 6008,
      "name": "notHunterOwner",
      "msg": "Not hunter owner"
    },
    {
      "code": 6009,
      "name": "invalidBearBalance",
      "msg": "Invalid bear balance"
    },
    {
      "code": 6010,
      "name": "insufficientBalance",
      "msg": "Insufficient balance"
    },
    {
      "code": 6011,
      "name": "insufficientOutputAmount",
      "msg": "Insufficient output amount"
    },
    {
      "code": 6012,
      "name": "insufficientStakedBalance",
      "msg": "Insufficient staked balance"
    },
    {
      "code": 6013,
      "name": "alreadyHunted",
      "msg": "hunter can only hunt once per 24 hours"
    },
    {
      "code": 6014,
      "name": "breedAfter24Hours",
      "msg": "Breed after 24 hours"
    },
    {
      "code": 6015,
      "name": "exitIslandNotAllowed",
      "msg": "Exit island is not allowed"
    }
  ],
  "types": [
    {
      "name": "gameState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gameInitialized",
            "type": "bool"
          },
          {
            "name": "hunterCollectionMint",
            "type": "pubkey"
          },
          {
            "name": "huntersMinted",
            "type": "u64"
          },
          {
            "name": "lpInitialized",
            "type": "bool"
          },
          {
            "name": "totalSupply",
            "type": "u64"
          },
          {
            "name": "lpSolBalance",
            "type": "u64"
          },
          {
            "name": "lpBearBalance",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "hunter",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenId",
            "type": "u64"
          },
          {
            "name": "huntRate",
            "type": "u64"
          },
          {
            "name": "lastHuntTime",
            "type": "u64"
          },
          {
            "name": "huntedCount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "userBearBalance",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "free",
            "type": "u64"
          },
          {
            "name": "staked",
            "type": "u64"
          },
          {
            "name": "huntedTime",
            "type": "u64"
          },
          {
            "name": "stakedTime",
            "type": "u64"
          },
          {
            "name": "requestUnstakeTime",
            "type": "u64"
          },
          {
            "name": "breedTime",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
