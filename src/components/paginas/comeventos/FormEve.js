import React, { Component } from "react";
import { Consumer } from "../../../context";
import Msg from "../../utiles/Msg";

/*
    Parámetros:
    id: Id de la Novedad
    eliminar: manejador de evento de eliminación
*/

class FormEve extends Component {
  constructor(props) {
    super(props);
    let date = new Date().toISOString().substr(0, 10);
    this.state = {
      loading: true,
      id: 0,
      registro: {
        id: 0,
        idlocalidad: 6, //Ciudad de San Luis por defecto
        titulo: "",
        lugar: "",
        direccion: "",
        dfecha: date,
        hfecha: date,
        dhora: "00:00:00",
        hhora: "00:00:00",
        descripcion: "",
        costo: 0,
        invita: "",
        organiza: "",
        foto_uno: "default.jpg",
        foto_dos: "default.jpg"
      },
      localidades: [],
      msg: {
        visible: false,
        body: "",
        tipo: 0
      }
    };
    this.setData = this.setData.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleLocalidadChange = this.handleLocalidadChange.bind(this);
    this.handleImgChange = this.handleImgChange.bind(this);
    this.saveData = this.saveData.bind(this);
    this.askDelete = this.askDelete.bind(this);
    this.okDelete = this.okDelete.bind(this);
  }

  handleImgChange(event) {
    //disparador ej: file-1-${this.state.registro.id
    //imagen ej: img-1-${this.state.registro.id
    let disparador = event.target.id.split("-");
    let id = `img-${disparador[1]}-${disparador[2]}`;
    var reader = new FileReader();
    reader.onload = function(e) {
      let imagen = document.getElementById(id);
      imagen.setAttribute("src", e.target.result);
    };
    reader.readAsDataURL(event.target.files[0]);
  }

  askDelete(titulo) {
    this.setState({
      msg: {
        visible: true,
        body: `Seguro de eliminar "${titulo}"`,
        tipo: 1
      }
    });
  }

  okDelete() {
    this.setState(
      {
        msg: {
          visible: false,
          body: "",
          tipo: 0
        }
      },
      () => {
        this.props.eliminar(this.state.registro.id);
      }
    );
  }

  saveData(event) {
    event.preventDefault();
    const formData = new FormData();
    Object.keys(this.state.registro).forEach(key =>
      formData.append(key, this.state.registro[key])
    );
    //Imágenes
    let img_uno = document.getElementById(`file-1-${this.state.registro.id}`)
      .files[0];
    if (img_uno) {
      formData.append("img-uno", img_uno, img_uno.name);
    }
    let img_dos = document.getElementById(`file-2-${this.state.registro.id}`)
      .files[0];
    if (img_dos) {
      formData.append("img-dos", img_dos, img_dos.name);
    }
    /*
        for(var pair of formData.entries()) {
            console.log(pair[0]+ ', '+ pair[1]);
        }
        */
    //Verificar tamaño de las imágenes no mas de 4MB
    if (formData.has("img-uno")) {
      if (formData.get("img-uno").size > 500000) {
        this.setState({
          msg: {
            tipo: 0,
            visible: true,
            body: "El tamaño de la primer imágen supera los 4MB."
          }
        });
        return false;
      }
    }
    if (formData.has("img-dos")) {
      if (formData.get("img-dos").size > 500000) {
        this.setState({
          msg: {
            tipo: 0,
            visible: true,
            body: "El tamaño de la segunda imágen supera los 4MB."
          }
        });
        return false;
      }
    }
    //Guardar los cambios
    let token = this.context.token;
    fetch(
      `${process.env.REACT_APP_API_HOST}/evento/${this.state.registro.id}`,
      {
        method: "POST",
        headers: {
          Authorization: token
        },
        body: formData
      }
    )
      .then(res => res.json())
      .then(
        result => {
          if (!result.err) {
            this.setState({
              msg: {
                tipo: 0,
                visible: true,
                body: "Los datos se guardaron correctamente"
              }
            });
          } else {
            this.setState({
              msg: {
                tipo: 0,
                visible: true,
                body: result.errMsgs
              }
            });
          }
        },
        error => {
          //???
          console.log(error);
        }
      );
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;
    this.setState({
      registro: {
        ...this.state.registro,
        [name]: value
      }
    });
  }

  handleLocalidadChange(event) {
    this.setState({
      registro: {
        ...this.state.registro,
        idlocalidad: event.target.value
      }
    });
  }

  setData() {
    let token = this.context.token;
    this.setState(
      {
        id: this.props.id,
        localidades: this.props.localidades
      },
      () => {
        fetch(`${process.env.REACT_APP_API_HOST}/evento/${this.state.id}`, {
          method: "GET",
          headers: {
            Authorization: token
            //"Content-Type": "application/json"
          }
        })
          .then(res => res.json())
          .then(
            result => {
              if (!result.err) {
                if (parseInt(result.data.count, 10) > 0) {
                  this.setState({
                    registro: result.data.registros[0],
                    loading: false
                  });
                } else {
                  console.log("No hay registro: " + this.state.id);
                }
              } else {
                this.setState({
                  msg: {
                    visible: true,
                    body: result.errMsg
                  }
                });
              }
            },
            error => {
              //???
              this.setState({
                msg: {
                  visible: true,
                  body: error
                }
              });
            }
          );
      }
    );
  }

  componentDidMount() {
    this.setData();
  }

  componentDidUpdate(prevProps) {
    if (this.props.id !== prevProps.id) {
      this.setData();
    }
  }

  render() {
    const localidades = this.state.localidades.map(localidad => {
      return (
        <option key={`loc-${localidad.id}`} value={localidad.id}>
          {localidad.nombre}
        </option>
      );
    });
    return (
      <React.Fragment>
        {this.state.loading ? (
          <h1>Cargando...</h1>
        ) : (
          <form method="post" onSubmit={this.saveData} id="frm-eventos">
            <div className="row border p-2 mb-3">
              <div className="col-sm-12 col-md-3">
                <div>
                  <input
                    type="file"
                    className="d-none"
                    name={`file-1-${this.state.registro.id}`}
                    id={`file-1-${this.state.registro.id}`}
                    accept="image/*"
                    onChange={this.handleImgChange}
                  />
                  <img
                    id={`img-1-${this.state.registro.id}`}
                    className="img-fluid"
                    style={{
                      width: "250px",
                      height: "200px",
                      objectFit: "cover"
                    }}
                    src={`${process.env.REACT_APP_API_HOST}/${
                      process.env.REACT_APP_API_DIRECTORY_EVENTOS_FOTOS
                    }/${this.state.registro.foto_uno}`}
                    alt="Foto"
                    onClick={e => {
                      document
                        .getElementById(`file-1-${this.state.registro.id}`)
                        .click();
                    }}
                  />
                </div>
                <div>
                  <input
                    type="file"
                    className="d-none"
                    name={`file-2-${this.state.registro.id}`}
                    id={`file-2-${this.state.registro.id}`}
                    accept="image/*"
                    onChange={this.handleImgChange}
                  />
                  <img
                    id={`img-2-${this.state.registro.id}`}
                    className="img-fluid mt-2"
                    style={{
                      width: "250px",
                      height: "200px",
                      objectFit: "cover"
                    }}
                    src={`${process.env.REACT_APP_API_HOST}/${
                      process.env.REACT_APP_API_DIRECTORY_EVENTOS_FOTOS
                    }/${this.state.registro.foto_dos}`}
                    alt="Foto"
                    onClick={e => {
                      document
                        .getElementById(`file-2-${this.state.registro.id}`)
                        .click();
                    }}
                  />
                </div>
              </div>
              <div className="col">
                <div className="row">
                  <div className="col-sm-12 col-md-6">
                    <div className="form-group">
                      <label htmlFor="idlocalidad">Localidad</label>
                      <select
                        name="idlocalidad"
                        id="idlocalidad"
                        className="form-control"
                        value={this.state.registro.idlocalidad}
                        onChange={this.handleLocalidadChange}
                      >
                        {localidades}
                      </select>
                    </div>
                  </div>
                  <div className="col-sm-12 col-md-6">
                    <div className="form-group">
                      <label htmlFor="titulo">Título</label>
                      <input
                        type="text"
                        name="titulo"
                        id="titulo"
                        className="form-control"
                        value={this.state.registro.titulo}
                        onChange={this.handleInputChange}
                        maxLength="100"
                      />
                    </div>
                  </div>
                  <div className="col-sm-12 col-md-6">
                    <div className="form-group">
                      <label htmlFor="lugar">Lugar</label>
                      <input
                        type="text"
                        name="lugar"
                        id="lugar"
                        className="form-control"
                        value={this.state.registro.lugar}
                        onChange={this.handleInputChange}
                        maxLength="100"
                      />
                    </div>
                  </div>
                  <div className="col-sm-12 col-md-6">
                    <div className="form-group">
                      <label htmlFor="direccion">Dirección</label>
                      <input
                        type="text"
                        name="direccion"
                        id="direccion"
                        className="form-control"
                        value={this.state.registro.direccion}
                        onChange={this.handleInputChange}
                        maxLength="100"
                      />
                    </div>
                  </div>
                  <div className="col-sm-12 col-md-6">
                    <div className="form-group">
                      <label htmlFor="invita">Invita</label>
                      <input
                        type="text"
                        name="invita"
                        id="invita"
                        className="form-control"
                        value={this.state.registro.invita}
                        onChange={this.handleInputChange}
                        maxLength="100"
                        placeholder="Ej: Ministerio de Turísmo y Parques"
                      />
                    </div>
                  </div>
                  <div className="col-sm-12 col-md-6">
                    <div className="form-group">
                      <label htmlFor="organiza">Organiza</label>
                      <input
                        type="text"
                        name="organiza"
                        id="organiza"
                        className="form-control"
                        value={this.state.registro.organiza}
                        onChange={this.handleInputChange}
                        maxLength="100"
                        placeholder="Ej: Gobierno de San Luis"
                      />
                    </div>
                  </div>
                  <div className="col-sm-12 col-md-12">
                    <div className="form-group">
                      <label htmlFor="descripcion">Descripción</label>
                      <textarea
                        rows="5"
                        name="descripcion"
                        id="descripcion"
                        className="form-control"
                        value={this.state.registro.descripcion}
                        onChange={this.handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col">
                    <div className="form-group">
                      <label htmlFor="dfecha">Desde Fecha</label>
                      <input
                        type="date"
                        name="dfecha"
                        id="dfecha"
                        className="form-control"
                        value={this.state.registro.dfecha}
                        onChange={this.handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col">
                    <div className="form-group">
                      <label htmlFor="hfecha">Hasta Fecha</label>
                      <input
                        type="date"
                        name="hfecha"
                        id="hfecha"
                        className="form-control"
                        value={this.state.registro.hfecha}
                        onChange={this.handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col">
                    <div className="form-group">
                      <label htmlFor="dhora">Desde Hora</label>
                      <input
                        type="text"
                        name="dhora"
                        id="dhora"
                        className="form-control"
                        value={this.state.registro.dhora}
                        onChange={this.handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col">
                    <div className="form-group">
                      <label htmlFor="hhora">Hasta Hora</label>
                      <input
                        type="text"
                        name="hhora"
                        id="hhora"
                        className="form-control"
                        value={this.state.registro.hhora}
                        onChange={this.handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col">
                    <div className="form-group">
                      <label htmlFor="costo">Costo</label>
                      <input
                        type="text"
                        name="costo"
                        id="costo"
                        className="form-control"
                        value={this.state.registro.costo}
                        onChange={this.handleInputChange}
                      />
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col">
                    <div className="d-flex justify-content-between">
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() =>
                          this.askDelete(this.state.registro.titulo)
                        }
                      >
                        <i className="fas fa-trash" />
                      </button>
                      <button type="submit" className="btn btn-primary">
                        <i className="fas fa-save" /> Guardar Cambios
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <hr className="mt-5 mb-5" />
          </form>
        )}
        <Msg
          visible={this.state.msg.visible}
          okAceptar={this.okDelete}
          okClose={() =>
            this.setState({
              msg: { ...this.state.msg, visible: false, tipo: 0 }
            })
          }
          tipo={this.state.msg.tipo}
        >
          {this.state.msg.body}
        </Msg>
      </React.Fragment>
    );
  }
}

FormEve.contextType = Consumer;

export default FormEve;
