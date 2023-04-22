/* eslint-disable no-empty */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Header, SelectType } from '@/presentation/components'
import Styles from './alinhamentoEstrategico.scss'

import React, { useContext, useState, useEffect } from 'react'
import DropZone from '@/presentation/components/dropzone/dropzone'
import Footer from '@/presentation/components/footer/footer'
import Modal from '@/presentation/components/modal/modal'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthContext } from '@/main/contexts/authcontext'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { createStrategicAlignmentRating, getRatingsByRequest } from '@/main/api/api'
import { TipoChamado } from '@/main/enums/tipo-chamado'

const MySwal = withReactContent(Swal)

const AlinhamentoEstrategico: React.FC = () => {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()
  const [openModal, setOpenModal] = useState(false)
  const [titulo, setTitulo] = useState<string>('')
  const [detalhes, setDetalhes] = useState<string>('')
  const [rating, setRating] = useState<string>('')
  const [targetGroup, setTargetGroup] = useState<string>('')
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [ratingAnalise, setRatingAnalise] = useState<any>(null)

  const options = [
    { value: 'Desenvolvimento', label: 'Desenvolvimento' },
    { value: 'PO', label: 'PO' },
    { value: 'Q&A', label: 'Q&A' }
  ]

  useEffect(() => {
    setRatingAnalise(null)
    loadRatings()
  }, [])

  const loadRatings = async () => {
    if (location.state != null) {
      if (location.state.status === 'Aberto' && location.state.requestType === TipoChamado.HOTFIX) {
        setRatingAnalise(null)
        return
      }
      if (location.state.requestStep === 'Analise de risco' && location.state.requestType === TipoChamado.FEATURE) {
        setRatingAnalise(null)
        return
      }

      try {
        const response = await getRatingsByRequest(location.state.request_id)

        if (response.data.length > 0) {
          const data = response.data
          setRatingAnalise(data[data.length - 1])
        }
      } catch (e) { /* empty */ }
    }
  }

  const handleRequest = async () => {
    try {
      const files: any[] = []
      if (uploadedFiles.length > 0) {
        uploadedFiles.forEach((file) => {
          files.push({
            file_name: file.name,
            base64: file.base64,
            ext: file.type
          })
        })
      }

      const response = await createStrategicAlignmentRating(
        location.state.request_id,
        user.user_id,
        rating,
        titulo,
        detalhes,
        targetGroup,
        files
      )

      MySwal.fire({
        html: "Avaliação feita com sucesso!",
        icon: "success",
        width: "350px",
        background: "#FAF0E6",
        color: "#000",
        confirmButtonColor: "#4FB4BC",
      }).then((r) => {
        navigate('/home')
      })
    } catch (e: any) {
      let errorMessage = e.response.data

      if (errorMessage === 'Missing required informations to create a rating') {
        errorMessage = "Preencha todas as informações.";
      } else if (errorMessage === 'User not found') {
        errorMessage = "Usuário inválido.";
      } else if (errorMessage === 'There is already a rating for this request from the same team') {
        errorMessage = 'Chamado já avaliado.'
      } else if (errorMessage === 'Request not found') {
        errorMessage = 'Chamado não encontrado.'
      } else if (errorMessage === 'Authorization not found') {
        errorMessage = 'Você precisa estar autenticado para realizar essa operação.'
      }

      MySwal.fire({
        icon: "error",
        html: errorMessage,
        width: "350px",
        background: "#FAF0E6",
        color: "#000",
        confirmButtonColor: "#4FB4BC",
      });
      
    }
  }

  const handleSubmit = (e: any) => {
    e.preventDefault()

    if (location.state === null) {
      MySwal.fire({
        icon: "error",
        html: "Chamado não encontrado.",
        width: "350px",
        background: "#FAF0E6",
        color: "#000",
        confirmButtonColor: "#4FB4BC",
      });
      return
    }

    if (titulo == null || titulo === '' || titulo === ' ') {
      MySwal.fire({
        title: "Opss...",
        html: "Título é obrigatório.",
        width: "350px",
        background: "#FAF0E6",
        color: "#000",
        confirmButtonColor: "#4FB4BC",
      });
      return
    }

    if (detalhes == null || detalhes === '' || detalhes === ' ') {
      MySwal.fire('Erro', '', 'error')
      MySwal.fire({
        title: "Opss...",
        html: "Detalhes é obrigatório.",
        width: "350px",
        background: "#FAF0E6",
        color: "#000",
        confirmButtonColor: "#4FB4BC",
      });
      return
    }

    if (rating == null || rating === '' || rating === ' ') {
      MySwal.fire({
        title: "Opss...",
        html: "Defina um nível de impacto.",
        width: "350px",
        background: "#FAF0E6",
        color: "#000",
        confirmButtonColor: "#4FB4BC",
      });
      return
    }

    if (targetGroup == null || targetGroup === '' || targetGroup === ' ') {
      MySwal.fire({
        title: "Opss...",
        html: "Selecione um grupo.",
        width: "350px",
        background: "#FAF0E6",
        color: "#000",
        confirmButtonColor: "#4FB4BC",
      });
      return
    }

    MySwal.fire({
      html: 'Deseja salvar avaliação?',
      showCancelButton: true,
      confirmButtonText: 'Sim',
      confirmButtonColor: '#4FB4BC',
      cancelButtonText: 'Cancelar',
      cancelButtonColor: '#A9A9A9',
      width: '350px',
      background:'#FAF0E6',
      color: '#000',
      reverseButtons: true
    }).then((r) => {
      if (r.isConfirmed) {
        handleRequest()
      }
    })
  }

  return (
    <div className={Styles.container}>
      <div className={Styles.H1formularioChamados}>
        <h1>Alinhamento estratégico</h1>
        <hr />
      </div>
      <div className={Styles.form}>
        <div className={Styles.tituloDetalhe}>
          <label htmlFor='titulo'>Título</label>
          <input
            type='text'
            value={titulo}
            onChange={(e) => {
              setTitulo(e.target.value)
            }}
            className={Styles.inputTitulo}
            id='titulo'
            maxLength={60}
          />
          <label htmlFor='detalhes'>Detalhes</label>
          <textarea
            className={Styles.inputDetalhe}
            value={detalhes}
            onChange={(e) => {
              setDetalhes(e.target.value)
            }}
            id='detalhes'
            cols={30}
            rows={10}
          ></textarea>

          <div className={Styles.formWrapper}>
            <form className={Styles.formAnalise} action='' method=''>
              <h3 className={Styles.formTitle}>Nível de impacto</h3>
              <hr />
              <div className={Styles.debtAmountSlider}>
                <input
                  type='radio'
                  onChange={(e) => {
                    setRating(e.target.value)
                  }}
                  name='debt-amount'
                  id='0'
                  value='0'
                  required
                />
                <label htmlFor='0' data-debt-amount='0'></label>
                <input
                  type='radio'
                  onChange={(e) => {
                    setRating(e.target.value)
                  }}
                  name='debt-amount'
                  id='1'
                  value='1'
                  required
                />
                <label htmlFor='1' data-debt-amount='1'></label>
                <input
                  type='radio'
                  onChange={(e) => {
                    setRating(e.target.value)
                  }}
                  name='debt-amount'
                  id='2'
                  value='2'
                  required
                />
                <label htmlFor='2' data-debt-amount='2'></label>
                <input
                  type='radio'
                  onChange={(e) => {
                    setRating(e.target.value)
                  }}
                  name='debt-amount'
                  id='3'
                  value='3'
                  required
                />
                <label htmlFor='3' data-debt-amount='3'></label>
                <div className={Styles.debtAmountPos}></div>
              </div>
            </form>
          </div>
          {ratingAnalise != null ? (
            <>
              <div
                className={Styles.openModal}
                onClick={() => {
                  setOpenModal(true)
                }}
              >
                <i className='large material-icons'>assignment_turned_in</i>
              </div>
              <Modal
                isOpen={openModal}
                titulo={
                  ratingAnalise != null
                    ? ratingAnalise.title +
                      ' - ' +
                      ratingAnalise.user.name +
                      ' (Avaliação: ' +
                      ratingAnalise.rating +
                      ')'
                    : 'Avaliação'
                }
                setModalClose={() => {
                  setOpenModal(!openModal)
                }}
              >
                {ratingAnalise != null ? (
                  <p>{ratingAnalise.description}</p>
                ) : (
                  <p>Ocorreu um erro ao carregar a avaliação.</p>
                )}
              </Modal>
            </>
          ) : (
            <></>
          )}
        </div>
        <div className={Styles.arquivoBotao}>
          <div className={Styles.dropzoneContainer}>
            <DropZone uploadedFiles={uploadedFiles} setUploadedFiles={setUploadedFiles} />
          </div>
          <label htmlFor='grupo' className={Styles.grupo}>
            Grupos
          </label>
          <SelectType onChange={setTargetGroup} options={options} />
          <input type='button' onClick={handleSubmit} className={Styles.buttonEnviar} value='Enviar' />
        </div>
      </div>
      {/* <Footer /> */}
    </div>
  )
}
export default AlinhamentoEstrategico
