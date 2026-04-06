{
  description = "Node.js project with Nix flake";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    let
      packageJson = builtins.fromJSON (builtins.readFile ./package.json);
      version = packageJson.version;
    in
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        lib = pkgs.lib;

        linuxBuildInputs = with pkgs; [
          glib
          glib-networking
          gtk3
          libayatana-appindicator
          librsvg
          libsoup_3
          openssl
          webkitgtk_4_1
        ];

        darwinBuildInputs = with pkgs; [
          libiconv
        ];

        tauriBuildInputs =
          lib.optionals pkgs.stdenv.isLinux linuxBuildInputs
          ++ lib.optionals pkgs.stdenv.isDarwin darwinBuildInputs;

        pnpmDeps = pkgs.fetchPnpmDeps {
          pname = "nesdot";
          inherit version;
          src = self;
          fetcherVersion = 3;
          hash = "sha256-LT+eJ2efEHo6+1EbZmrXAIKBCPi/+gAqTOqCl9UnN5M=";
        };

        webPackage = pkgs.stdenv.mkDerivation {
          pname = "nesdot-web";
          inherit version;
          src = self;
          inherit pnpmDeps;

          pnpmRoot = ".";

          nativeBuildInputs = [
            pkgs.nodejs_24
            pkgs.pnpm
            pkgs.pnpmConfigHook
            pkgs.perl
          ];

          buildPhase = ''
            runHook preBuild

            pnpm run build

            runHook postBuild
          '';

          installPhase = ''
            runHook preInstall

            mkdir -p "$out"
            cp -r dist "$out/"

            runHook postInstall
          '';
        };

        desktopPackage = pkgs.rustPlatform.buildRustPackage {
          pname = "nesdot-desktop";
          inherit version;
          src = self;

          cargoRoot = "src-tauri";
          buildAndTestSubdir = "src-tauri";
          cargoLock = {
            lockFile = ./src-tauri/Cargo.lock;
          };

          nativeBuildInputs = [
            pkgs.pkg-config
          ];

          buildInputs = tauriBuildInputs;

          preBuild = ''
            mkdir -p ./dist
            cp -r ${webPackage}/dist/. ./dist/
          '';

          cargoBuildFlags = [
            "--features"
            "tauri/custom-protocol"
          ];

          doCheck = false;
        };
      in
      {
        packages = {
          default = desktopPackage;
          desktop = desktopPackage;
          web = webPackage;
        };

        devShells.default = pkgs.mkShell {
          packages =
            (with pkgs; [
              nodejs_24
              pnpm
              cargo
              rustc
              rustfmt
              clippy
              pkg-config
            ])
            ++ lib.optionals pkgs.stdenv.isLinux (
              with pkgs;
              [
                glib
                glib-networking
                gtk3
                libayatana-appindicator
                librsvg
                libsoup_3
                xdotool
                openssl
                webkitgtk_4_1
              ]
            )
            ++ lib.optionals pkgs.stdenv.isDarwin (
              with pkgs;
              [
                libiconv
              ]
            );
        };
      }
    );
}
