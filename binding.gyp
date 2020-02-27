{
    'targets': [{
        'target_name': 'snowboy',
        'sources': [
            'src/snowboy.cc'
        ],
        'conditions': [
            ['OS=="mac"', {
                'link_settings': {
                    'libraries': [
                        '<(module_root_dir)/src/snowboy/osx/libsnowboy-detect.a',
                    ]
                }
            }],
            ['OS=="linux" and target_arch=="x64"', {
                'link_settings': {
                    'ldflags': [
                        '-Wl,--no-as-needed',
                    ],
                    'libraries': [
                        '<(module_root_dir)/src/snowboy/ubuntu64/libsnowboy-detect.a',
                    ]
                }
            }],
            ['OS=="linux" and target_arch=="arm"', {
                'link_settings': {
                    'ldflags': [
                        '-Wl,--no-as-needed',
                    ],
                    'libraries': [
                        '<(module_root_dir)/src/snowboy/rpi/libsnowboy-detect.a',
                    ]
                }
            }],
            ['OS=="linux" and target_arch=="arm64"', {
                'link_settings': {
                    'ldflags': [
                        '-Wl,--no-as-needed',
                    ],
                    'libraries': [
                        '<(module_root_dir)/src/snowboy/aarch64-ubuntu1604/libsnowboy-detect.a',
                    ]
                }
            }]
        ],
        'cflags': [
            '-std=c++11',
            '-fexceptions',
            '-Wall',
            '-D_GLIBCXX_USE_CXX11_ABI=0'
        ],
        'cflags!': [
            '-fno-exceptions'
        ],
        'cflags_cc!': [
            '-fno-exceptions'
        ],
        'include_dirs': [
            "<!(node -e \"require('nan')\")",
            "<!(pwd)/include"
        ],
        'libraries': [
            '-lblas'
        ],
        'xcode_settings': {
            'MACOSX_DEPLOYMENT_TARGET': '10.11',
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            'OTHER_CFLAGS': [
                '-std=c++11',
                '-stdlib=libc++'
            ]
        }
    },
    {
      "target_name": "action_after_build",
      "type": "none",
      "dependencies": [ "<(module_name)" ],
      "copies": [
        {
          "files": [ "<(PRODUCT_DIR)/<(module_name).node" ],
          "destination": "<(module_path)"
        }
      ]
    }
    ]
}