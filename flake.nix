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
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        lib = pkgs.lib;
      in
      {
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
